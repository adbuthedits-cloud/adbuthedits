const express = require('express');
const router = express.Router();
const axios = require('axios');
const EmailSuppression = require('../models/EmailSuppression');

/**
 * POST /api/ses/notifications
 *
 * Receives bounce and complaint notifications from AWS SNS.
 * AWS SNS first sends a SubscriptionConfirmation — we auto-confirm it.
 * Then on real bounce/complaint events, we save the email to the suppression list.
 */
router.post('/notifications', express.raw({ type: '*/*' }), async (req, res) => {
    try {
        // SNS sends JSON as text/plain or application/json — parse safely
        let body;
        if (Buffer.isBuffer(req.body)) {
            body = JSON.parse(req.body.toString('utf8'));
        } else if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
        } else {
            body = req.body;
        }

        const messageType = req.headers['x-amz-sns-message-type'];

        console.log(`[SES-SNS] Received message type: ${messageType}`);

        // ── Step 1: Auto-confirm the SNS subscription ──────────────────────────
        if (messageType === 'SubscriptionConfirmation') {
            const confirmUrl = body.SubscribeURL;
            if (confirmUrl) {
                await axios.get(confirmUrl);
                console.log('[SES-SNS] ✅ SNS Subscription confirmed successfully.');
            }
            return res.status(200).json({ ok: true, message: 'Subscription confirmed' });
        }

        // ── Step 2: Handle bounce and complaint notifications ──────────────────
        if (messageType === 'Notification') {
            let notification;
            try {
                notification = JSON.parse(body.Message);
            } catch (e) {
                console.error('[SES-SNS] Failed to parse notification Message:', e);
                return res.status(400).json({ error: 'Invalid notification Message' });
            }

            const notifType = notification.notificationType;

            // ── BOUNCE ────────────────────────────────────────────────────────
            if (notifType === 'Bounce') {
                const bounce = notification.bounce;
                const bounceType = bounce?.bounceType || 'Undetermined';

                // Only suppress permanent bounces — transient (e.g. mailbox full) are temporary
                if (bounceType === 'Permanent' || bounceType === 'Undetermined') {
                    const recipients = bounce?.bouncedRecipients || [];
                    for (const recipient of recipients) {
                        const email = recipient.emailAddress?.toLowerCase();
                        if (!email) continue;
                        try {
                            await EmailSuppression.upsert({
                                email,
                                reason: 'bounce',
                                bounce_type: bounceType,
                                raw_payload: JSON.stringify(notification),
                                suppressed_at: new Date(),
                            }, { conflictFields: ['email'] });
                            console.log(`[SES-SNS] ⛔ Suppressed bounced email: ${email} (${bounceType})`);
                        } catch (dbErr) {
                            console.error(`[SES-SNS] DB error suppressing ${email}:`, dbErr.message);
                        }
                    }
                } else {
                    console.log(`[SES-SNS] Transient bounce ignored for: ${bounce?.bouncedRecipients?.map(r => r.emailAddress).join(', ')}`);
                }
            }

            // ── COMPLAINT ─────────────────────────────────────────────────────
            if (notifType === 'Complaint') {
                const complaint = notification.complaint;
                const recipients = complaint?.complainedRecipients || [];
                for (const recipient of recipients) {
                    const email = recipient.emailAddress?.toLowerCase();
                    if (!email) continue;
                    try {
                        await EmailSuppression.upsert({
                            email,
                            reason: 'complaint',
                            bounce_type: null,
                            raw_payload: JSON.stringify(notification),
                            suppressed_at: new Date(),
                        }, { conflictFields: ['email'] });
                        console.log(`[SES-SNS] ⛔ Suppressed complained email: ${email}`);
                    } catch (dbErr) {
                        console.error(`[SES-SNS] DB error suppressing ${email}:`, dbErr.message);
                    }
                }
            }

            return res.status(200).json({ ok: true });
        }

        // Any other message type — just acknowledge
        return res.status(200).json({ ok: true });

    } catch (err) {
        console.error('[SES-SNS] Unexpected error in notification handler:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/ses/suppressed
 * Admin utility — list all suppressed emails (for the admin panel)
 */
router.get('/suppressed', async (req, res) => {
    try {
        const list = await EmailSuppression.findAll({
            order: [['created_at', 'DESC']],
            limit: 200,
        });
        return res.json({ ok: true, count: list.length, data: list });
    } catch (err) {
        console.error('[SES-SNS] Failed to fetch suppression list:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/ses/suppressed/:email
 * Admin utility — manually remove an email from suppression (e.g. customer re-confirmed)
 */
router.delete('/suppressed/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase();
        const deleted = await EmailSuppression.destroy({ where: { email } });
        if (deleted) {
            return res.json({ ok: true, message: `${email} removed from suppression list` });
        }
        return res.status(404).json({ ok: false, message: 'Email not found in suppression list' });
    } catch (err) {
        console.error('[SES-SNS] Failed to remove from suppression list:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
