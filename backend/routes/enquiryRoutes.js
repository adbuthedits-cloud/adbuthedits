const express = require('express');
const router = express.Router();
const { Enquiry } = require('../models');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { privateS3 } = require('../config/s3Client');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { sendReply } = require('../utils/emailService');

// Configure Multer S3 for Private R2 Bucket
const upload = multer({
    storage: multerS3({
        s3: privateS3,
        bucket: process.env.R2_PRIVATE_BUCKET || 'adbuth-private',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileName = `enquiry/${Date.now()}_${path.basename(file.originalname)}`;
            cb(null, fileName);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/enquiry - Submit enquiry with optional attachments (PUBLIC)
router.post('/', (req, res, next) => {
    console.log('POST /api/enquiry hit');
    next();
}, upload.array('attachments', 5), async (req, res) => {
    try {
        const {
            fullName, email, phone, companyName, city,
            service, subService, requirementType, requirementDesc, timeline
        } = req.body;

        const attachmentUrls = req.files ? req.files.map(file => ({
            name: file.originalname,
            url: file.location,
            key: file.key
        })) : [];

        const enquiry = await Enquiry.create({
            full_name: fullName,
            email,
            phone,
            company_name: companyName,
            city,
            service,
            sub_service: subService,
            requirement_type: requirementType,
            requirement_desc: requirementDesc,
            expected_timeline: timeline,
            attachments: attachmentUrls,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
    } catch (error) {
        console.error('Enquiry Submission Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit enquiry', error: error.message });
    }
});

// GET /api/enquiry - List all enquiries (ADMIN ONLY)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, search } = req.query;
        const where = {};
        if (status && status !== 'all') where.status = status;

        let enquiries = await Enquiry.findAll({
            where,
            order: [['created_at', 'DESC']]
        });

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

// GET /api/enquiry/:id - Get single enquiry (ADMIN ONLY)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
        res.json(enquiry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/enquiry/:id/status - Update enquiry status (ADMIN ONLY)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'in-review', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

        await enquiry.update({ status });
        res.json({ success: true, enquiry });
    } catch (err) {
        console.error('Update Status Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/enquiry/:id/reply - Send email reply to customer (ADMIN ONLY)
router.post('/:id/reply', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }

        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: linear-gradient(135deg, #7D287E, #4a1050); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Adbuth Productions</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Response to your Enquiry</p>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
                    <p style="font-size: 16px;">Hello <strong>${enquiry.full_name}</strong>,</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #7D287E; margin: 20px 0; white-space: pre-wrap; font-size: 15px; line-height: 1.6;">
                        ${message.replace(/\n/g, '<br/>')}
                    </div>
                    <p style="color: #888; font-size: 13px; margin-top: 20px;">
                        This email is in response to your enquiry regarding <strong>${enquiry.service}</strong>.
                        <br/>If you have further questions, feel free to reply to this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #aaa; font-size: 12px; text-align: center;">
                        Adbuth Productions | adbuthedits@gmail.com | +91 91826 83055
                    </p>
                </div>
            </div>
        `;

        await sendReply({ to: enquiry.email, subject, html: htmlBody });

        // Update status to in-review if still pending
        if (enquiry.status === 'pending') {
            await enquiry.update({ status: 'in-review' });
        }

        res.json({ success: true, message: `Reply sent to ${enquiry.email}` });
    } catch (err) {
        console.error('Reply Error:', err);
        res.status(500).json({ error: 'Failed to send email: ' + err.message });
    }
});

// GET /api/enquiry/:id/attachment-url?key=<r2-key> - Generate presigned URL (ADMIN ONLY)
router.get('/:id/attachment-url', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'File key is required' });

        // Security: ensure the file belongs to this enquiry
        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

        const attachmentKeys = (enquiry.attachments || []).map(a => a.key);
        if (!attachmentKeys.includes(key)) {
            return res.status(403).json({ error: 'File does not belong to this enquiry' });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.R2_PRIVATE_BUCKET || 'adbuth-private',
            Key: key,
        });

        // Generate a URL valid for 1 hour
        const signedUrl = await getSignedUrl(privateS3, command, { expiresIn: 3600 });
        res.json({ url: signedUrl });
    } catch (err) {
        console.error('Presigned URL Error:', err);
        res.status(500).json({ error: 'Failed to generate file URL' });
    }
});

module.exports = router;


