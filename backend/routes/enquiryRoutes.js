const express = require('express');
const router = express.Router();
const { Enquiry, EnquiryReply, Admin } = require('../models');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { privateS3 } = require('../config/s3Client');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { sendReply } = require('../utils/emailService');

// --- Multer for R2 Private Bucket ---
const upload = multer({
    storage: multerS3({
        s3: privateS3,
        bucket: process.env.R2_PRIVATE_BUCKET || 'adbuth-private',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
        key: (req, file, cb) => cb(null, `enquiry/${Date.now()}_${path.basename(file.originalname)}`)
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ============================================================
// PUBLIC ENDPOINTS
// ============================================================

// POST /api/enquiry — Submit enquiry form
router.post('/', upload.array('attachments', 5), async (req, res) => {
    try {
        const {
            fullName, firstName, lastName, email, phone, companyName, city,
            service, subService, requirementType, requirementDesc, timeline,
            message, source
        } = req.body;

        const name = fullName || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';

        const attachmentUrls = (req.files || []).map(file => ({
            name: file.originalname,
            url: file.location,
            key: file.key
        }));

        const enquiry = await Enquiry.create({
            source: source || 'enquiry_form',
            full_name: name,
            email,
            phone: phone || null,
            company_name: companyName || null,
            city: city || null,
            service: service || null,
            sub_service: subService || null,
            requirement_type: requirementType || null,
            requirement_desc: requirementDesc || message || null,
            expected_timeline: timeline || null,
            attachments: attachmentUrls,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
    } catch (error) {
        console.error('Enquiry Submission Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit enquiry', error: error.message });
    }
});

// POST /api/enquiry/contact — Contact form submission
router.post('/contact', async (req, res) => {
    try {
        const { name, email, mobile, city, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email and message are required' });
        }
        const enquiry = await Enquiry.create({
            source: 'contact_form',
            full_name: name,
            email,
            phone: mobile || null,
            city: city || null,
            requirement_desc: message,
            status: 'pending'
        });
        res.status(201).json({ success: true, message: 'Message sent successfully', data: enquiry });
    } catch (error) {
        console.error('Contact Form Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// ============================================================
// ADMIN ENDPOINTS — All require auth + admin middleware
// ============================================================

// GET /api/enquiry — List all enquiries
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, search, source } = req.query;
        const where = {};
        // Only filter by status in SQL (always existed)
        if (status && status !== 'all') where.status = status;

        let enquiries = await Enquiry.findAll({
            where,
            order: [['created_at', 'DESC']]
        });

        // JS-level filters (safe even if column was just added)
        if (source && source !== 'all') {
            enquiries = enquiries.filter(e => e.source === source);
        }
        if (search) {
            const s = search.toLowerCase();
            enquiries = enquiries.filter(e =>
                e.full_name?.toLowerCase().includes(s) ||
                e.email?.toLowerCase().includes(s) ||
                e.service?.toLowerCase().includes(s) ||
                e.phone?.includes(s)
            );
        }

        res.json(enquiries);
    } catch (err) {
        console.error('Get Enquiries Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/enquiry/:id — Get single enquiry with full reply history
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const enquiry = await Enquiry.findByPk(req.params.id, {
            include: [{
                model: EnquiryReply,
                as: 'replies',
                required: false,
                order: [['created_at', 'ASC']]
            }]
        });
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
        res.json(enquiry);
    } catch (err) {
        console.error('Get Single Enquiry Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/enquiry/:id/status — Update status
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'in-review', 'resolved'];
        if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

        await enquiry.update({ status });
        res.json({ success: true, enquiry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/enquiry/:id/reply — Send email + save to reply history
router.post('/:id/reply', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { subject, message, channel = 'email' } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

        // Get admin info for attribution
        const admin = await Admin.findByPk(req.user.id, {
            include: [{ model: require('../models/Role'), as: 'roleDetails', required: false }]
        }).catch(() => null);

        const adminName = admin ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() : 'Admin';
        const adminRole = admin?.roleDetails?.name || req.user?.role || 'Staff';

        // Save reply to history
        const reply = await EnquiryReply.create({
            enquiry_id: req.params.id,
            admin_id: req.user.id,
            admin_name: adminName,
            admin_role: adminRole,
            subject: subject || `Re: Enquiry about ${enquiry.service || 'your inquiry'}`,
            message,
            channel
        });

        // Send email if channel is 'email'
        if (channel === 'email') {
            const htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background: linear-gradient(135deg, #7D287E, #4a1050); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 22px;">Adbuth Productions</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Response to your enquiry</p>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
                        <p style="font-size: 15px; margin-top: 0;">Hello <strong>${enquiry.full_name}</strong>,</p>
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #7D287E; margin: 20px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.7;">
                            ${message.replace(/\n/g, '<br/>')}
                        </div>
                        <p style="color: #999; font-size: 12px; margin-top: 20px;">
                            Replied by <strong>${adminName}</strong> (${adminRole}) · Adbuth Productions
                            <br/>If you have further questions, reply to this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="color: #bbb; font-size: 11px; text-align: center; margin: 0;">
                            adbuthedits@gmail.com · +91 91826 83055
                        </p>
                    </div>
                </div>`;

            await sendReply({
                to: enquiry.email,
                subject: subject || `Re: Enquiry about ${enquiry.service || 'your inquiry'}`,
                html: htmlBody
            });
        }

        // Auto-update status to in-review when first reply is sent
        if (enquiry.status === 'pending') {
            await enquiry.update({ status: 'in-review' });
        }

        res.json({ success: true, reply, message: channel === 'email' ? `Reply sent to ${enquiry.email}` : 'Note saved' });
    } catch (err) {
        console.error('Reply Error:', err);
        res.status(500).json({ error: 'Failed to send reply: ' + err.message });
    }
});

// GET /api/enquiry/:id/attachment-url?key=... — Presigned URL for private file
router.get('/:id/attachment-url', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'File key is required' });

        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

        const keys = (enquiry.attachments || []).map(a => a.key);
        if (!keys.includes(key)) return res.status(403).json({ error: 'File does not belong to this enquiry' });

        const command = new GetObjectCommand({
            Bucket: process.env.R2_PRIVATE_BUCKET || 'adbuth-private',
            Key: key,
        });

        const signedUrl = await getSignedUrl(privateS3, command, { expiresIn: 3600 });
        res.json({ url: signedUrl });
    } catch (err) {
        console.error('Presigned URL Error:', err);
        res.status(500).json({ error: 'Failed to generate file URL' });
    }
});

module.exports = router;
