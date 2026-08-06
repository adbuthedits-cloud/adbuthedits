const { OrderItem, Order, User, Product } = require('../models');
const { Op } = require('sequelize');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { publicS3 } = require('../config/s3Client');
const { sendReply } = require('../utils/emailService');
const { getDeletionWarningTemplate, getDeletionConfirmedTemplate } = require('../utils/emailTemplates');

/**
 * Cleanup User Uploads from Cloud Storage and Database
 * Policy: 
 * - 12 Days After Delivery: Send 72h Warning Email
 * - 15 Days After Delivery: Delete Files & Send Confirmation Email
 */
const cleanupUserUploads = async () => {
    console.log('[Cleanup Task] Starting daily scan...');
    
    try {
        const now = new Date();
        const twelveDaysAgo = new Date(now.getTime() - (12 * 24 * 60 * 60 * 1000));
        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));

        // --- STAGE 1: SEND 72-HOUR WARNINGS ---
        const itemsToWarn = await OrderItem.findAll({
            where: {
                delivery_status: 'delivered',
                delivered_at: { [Op.lte]: twelveDaysAgo },
                warning_sent: false,
                customization: { [Op.not]: null }
            },
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [{ model: User, as: 'user', attributes: ['email', 'first_name'] }]
                },
                { model: Product, as: 'product', attributes: ['title'] }
            ]
        });

        console.log(`[Cleanup Task] Found ${itemsToWarn.length} items for 72h warnings.`);

        for (const item of itemsToWarn) {
            const user = item.order?.user;
            if (user && user.email) {
                try {
                    const html = await getDeletionWarningTemplate(user.first_name, item.product?.title, item.order_id);
                    await sendReply({
                        to: user.email,
                        subject: `Action Required: Your files for Order #${item.order_id.substring(0,8)} expire in 72 hours`,
                        html
                    });
                    
                    item.warning_sent = true;
                    await item.save();
                    console.log(`[Cleanup Task] 72h Warning sent to: ${user.email}`);
                } catch (emailErr) {
                    console.error(`[Cleanup Task] Email error (Warning):`, emailErr.message);
                }
            }
        }

        // --- STAGE 2: PERMANENT DELETION ---
        const itemsToDelete = await OrderItem.findAll({
            where: {
                delivery_status: 'delivered',
                delivered_at: { [Op.lte]: fifteenDaysAgo },
                customization: { [Op.not]: null }
            },
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [{ model: User, as: 'user', attributes: ['email', 'first_name'] }]
                },
                { model: Product, as: 'product', attributes: ['title'] }
            ]
        });

        // Filter out items that are already "Cleaned Up" (where customization is just the deletion message string)
        const eligibleDeletions = itemsToDelete.filter(item => {
            return typeof item.customization === 'object' && item.customization !== null;
        });

        console.log(`[Cleanup Task] Found ${eligibleDeletions.length} items for final deletion.`);

        for (const item of eligibleDeletions) {
            let filesDeleted = 0;
            const user = item.order?.user;

            // Recursive function to find and delete URLs in customization JSON
            const { privateS3 } = require('../config/s3Client'); // Ensure privateS3 is available
            
            const processCustomization = async (obj) => {
                if (typeof obj === 'string') {
                    const isPrivate = obj.includes(process.env.R2_PRIVATE_BUCKET);
                    const isUserUpload = obj.includes('/user-uploads/');
                    
                    if (isPrivate || isUserUpload) {
                        try {
                            const urlObj = new URL(obj);
                            let fileKey = decodeURIComponent(urlObj.pathname.substring(1));
                            
                            // Determine which bucket and client to use
                            let bucket = process.env.R2_PUBLIC_BUCKET;
                            let client = publicS3;

                            if (obj.includes(process.env.R2_PRIVATE_BUCKET)) {
                                bucket = process.env.R2_PRIVATE_BUCKET;
                                client = privateS3;
                                
                                // Strip bucket name from key if path-style
                                if (fileKey.startsWith(`${bucket}/`)) {
                                    fileKey = fileKey.replace(`${bucket}/`, '');
                                }
                            }

                            if (fileKey) {
                                await client.send(new DeleteObjectCommand({
                                    Bucket: bucket,
                                    Key: fileKey
                                }));
                                filesDeleted++;
                                return `[FILE DELETED AFTER 15 DAYS] - ${fileKey}`;
                            }
                        } catch (err) {
                            console.error(`[Cleanup Task] Storage error for ${obj}:`, err.message);
                        }
                    }
                    return obj;
                } else if (Array.isArray(obj)) {
                    return await Promise.all(obj.map(i => processCustomization(i)));
                } else if (obj !== null && typeof obj === 'object') {
                    const newObj = {};
                    for (const [key, value] of Object.entries(obj)) {
                        newObj[key] = await processCustomization(value);
                    }
                    return newObj;
                }
                return obj;
            };

            const updatedCustomization = await processCustomization(item.customization);

            if (filesDeleted > 0) {
                // Update the item to reflect the deletion
                item.customization = updatedCustomization;
                await item.save();
                console.log(`[Cleanup Task] Item ${item.order_item_id}: Deleted ${filesDeleted} files.`);

                // Send Final Deletion Confirmation Email
                if (user && user.email) {
                    try {
                        const html = await getDeletionConfirmedTemplate(user.first_name, item.product?.title);
                        await sendReply({
                            to: user.email,
                            subject: `Privacy Notice: Your temporary files have been deleted`,
                            html
                        });
                        console.log(`[Cleanup Task] Deletion confirmation sent to: ${user.email}`);
                    } catch (emailErr) {
                        console.error(`[Cleanup Task] Email error (Confirmation):`, emailErr.message);
                    }
                }
            }
        }

        console.log('[Cleanup Task] Scan finished.');
    } catch (err) {
        console.error('[Cleanup Task] Critical Error:', err);
    }
};

module.exports = cleanupUserUploads;
