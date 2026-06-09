/**
 * orderQueue.js
 * 
 * BullMQ powered order workflow queue.
 * - Handles: assign, pickup, progress updates
 * - Rate-limits email dispatch: max 10 emails/sec
 * - Ensures exclusive claiming via DB transaction
 */

const { Queue, Worker, QueueEvents } = require('bullmq');

// BullMQ uses ioredis internally — build connection from existing env
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableOfflineQueue: false,
    // Skip version check — allows compatibility with Redis 5.x
    enableReadyCheck: false,
};

// Parse full URL if provided
if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis://')) {
    try {
        const url = new URL(process.env.REDIS_URL);
        redisConnection.host = url.hostname;
        redisConnection.port = parseInt(url.port || '6379');
        if (url.password) redisConnection.password = url.password;
    } catch (e) {
        console.warn('[OrderQueue] Could not parse REDIS_URL, using defaults');
    }
}

// ─── QUEUES ────────────────────────────────────────────────────────────────

// Main order workflow queue
const orderQueue = new Queue('order-workflow', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,
    }
});

// Dedicated email queue with rate-limiting: 10 emails per second
const emailQueue = new Queue('order-emails', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 200,
        removeOnFail: 100,
    }
});

// ─── WORKERS ───────────────────────────────────────────────────────────────

async function startWorkers() {
    const { Order, OrderTimeline, Admin, User, sequelize } = require('../models');
    const { sendOrderProcessingEmail, sendReassignmentNotificationEmail } = require('../utils/orderMailer');

    // --- Order Workflow Worker ---
    const workflowWorker = new Worker('order-workflow', async (job) => {
        const { type, orderId, adminId, actorName, actorRole, notes, metadata } = job.data;
        console.log(`[OrderQueue] Processing job: ${type} for order: ${orderId}`);

        let action, statusLabel, orderUpdate = {}, timelineEntry = {};

        switch (type) {
            case 'ASSIGN': {
                // Transactional exclusive assignment
                const result = await sequelize.transaction(async (t) => {
                    const order = await Order.findByPk(orderId, {
                        lock: t.LOCK.UPDATE,
                        transaction: t
                    });
                    if (!order) throw new Error('Order not found');

                    const previousAssignee = order.assigned_to;
                    
                    await order.update({
                        assigned_to: metadata.assignedTo,
                        assigned_at: new Date(),
                        working_status: 'assigned',
                    }, { transaction: t });

                    await OrderTimeline.create({
                        order_id: orderId,
                        admin_id: adminId,
                        actor_name: actorName,
                        actor_role: actorRole,
                        action: previousAssignee ? 'REASSIGNED' : 'ASSIGNED',
                        status_label: 'Order Assigned',
                        notes: notes || `Assigned to ${metadata.assigneeName}`,
                        metadata: { assignedTo: metadata.assignedTo, assigneeName: metadata.assigneeName, previousAssignee },
                        event_at: new Date(),
                    }, { transaction: t });

                    return { previousAssignee, order };
                });

                // If reassigned, notify the previous assignee
                if (result.previousAssignee && result.previousAssignee !== metadata.assignedTo) {
                    const prevAdmin = await Admin.findByPk(result.previousAssignee);
                    if (prevAdmin?.email) {
                        await emailQueue.add('reassignment-notification', {
                            to: prevAdmin.email,
                            name: prevAdmin.first_name,
                            orderId,
                            newAssigneeName: metadata.assigneeName,
                        });
                    }
                }
                break;
            }

            case 'PICKUP': {
                // Exclusive claiming — only one employee can claim
                await sequelize.transaction(async (t) => {
                    const order = await Order.findByPk(orderId, {
                        lock: t.LOCK.UPDATE,
                        transaction: t
                    });
                    if (!order) throw new Error('Order not found');

                    // If already picked up by someone else, reject
                    if (order.picked_up_at && order.working_status === 'in_progress') {
                        throw new Error('ORDER_ALREADY_CLAIMED');
                    }

                    await order.update({
                        picked_up_at: new Date(),
                        working_status: 'in_progress',
                        status: 'inprocessing', // Customer sees this
                    }, { transaction: t });

                    await OrderTimeline.create({
                        order_id: orderId,
                        admin_id: adminId,
                        actor_name: actorName,
                        actor_role: actorRole,
                        action: 'PICKED_UP',
                        status_label: 'Work Started',
                        notes: notes || 'Employee picked up the order and started working.',
                        event_at: new Date(),
                    }, { transaction: t });
                });

                // Queue customer "In Progress" email (Disabled per user request)
                /*
                const order = await Order.findByPk(orderId, {
                    include: [{ model: User, as: 'user' }]
                });
                if (order?.user?.email) {
                    await emailQueue.add('order-inprogress', {
                        to: order.user.email,
                        name: order.user.first_name,
                        orderId,
                        orderRef: orderId.substring(0, 8).toUpperCase(),
                    });
                }
                */
                break;
            }

            case 'PROGRESS_UPDATE': {
                await OrderTimeline.create({
                    order_id: orderId,
                    admin_id: adminId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'PROGRESS_UPDATE',
                    status_label: metadata.label || 'Progress Update',
                    notes: notes,
                    event_at: new Date(),
                });
                break;
            }

            case 'DELIVERED': {
                await sequelize.transaction(async (t) => {
                    await Order.update({
                        working_status: 'delivered',
                        status: 'delivered',
                    }, { where: { order_id: orderId }, transaction: t });

                    await OrderTimeline.create({
                        order_id: orderId,
                        admin_id: adminId,
                        actor_name: actorName,
                        actor_role: actorRole,
                        action: 'DELIVERED',
                        status_label: 'Order Delivered',
                        notes: notes || 'Order files submitted and delivered to customer.',
                        event_at: new Date(),
                    }, { transaction: t });
                });
                break;
            }

            default:
                throw new Error(`Unknown job type: ${type}`);
        }

    }, {
        connection: redisConnection,
        concurrency: 5,
    });

    workflowWorker.on('completed', (job) => {
        console.log(`[OrderQueue] ✅ Job ${job.id} (${job.data.type}) completed`);
    });
    workflowWorker.on('failed', (job, err) => {
        console.error(`[OrderQueue] ❌ Job ${job?.id} (${job?.data?.type}) failed: ${err.message}`);
    });

    // --- Email Worker (Rate-limited: 10 emails/sec) ---
    const emailWorker = new Worker('order-emails', async (job) => {
        const { sendOrderProcessingEmail, sendReassignmentNotificationEmail } = require('../utils/orderMailer');

        if (job.name === 'order-inprogress') {
            await sendOrderProcessingEmail(job.data);
        } else if (job.name === 'reassignment-notification') {
            await sendReassignmentNotificationEmail(job.data);
        }
    }, {
        connection: redisConnection,
        concurrency: 10,
        limiter: {
            max: 10,       // Max 10 jobs per duration window
            duration: 1000 // 1 second
        }
    });

    emailWorker.on('completed', (job) => {
        console.log(`[EmailQueue] ✅ Email sent: ${job.name}`);
    });
    emailWorker.on('failed', (job, err) => {
        console.error(`[EmailQueue] ❌ Email failed: ${job?.name} — ${err.message}`);
    });

    console.log('[OrderQueue] Workers started: order-workflow + order-emails');
    return { workflowWorker, emailWorker };
}

module.exports = { orderQueue, emailQueue, startWorkers };
