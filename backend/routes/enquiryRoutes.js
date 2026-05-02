const express = require('express');
const router = express.Router();
const { Enquiry } = require('../models');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { privateS3 } = require('../config/s3Client');
const path = require('path');

// Configure Multer S3 for Private R2 Bucket
const upload = multer({
    storage: multerS3({
        s3: privateS3,
        bucket: process.env.R2_PRIVATE_BUCKET || 'adbuth-private',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            console.log('Multer S3 Metadata processing:', file.originalname);
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileName = `enquiry/${Date.now()}_${path.basename(file.originalname)}`;
            console.log('Multer S3 Key generating:', fileName);
            cb(null, fileName);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/enquiry - Submit enquiry with optional attachments
router.post('/', (req, res, next) => {
    console.log('POST /api/enquiry hit');
    next();
}, upload.array('attachments', 5), async (req, res) => {
    console.log('POST /api/enquiry handler processing');
    try {
        const {
            fullName,
            email,
            phone,
            companyName,
            city,
            service,
            subService,
            requirementType,
            requirementDesc,
            timeline
        } = req.body;

        const attachmentUrls = req.files ? req.files.map(file => ({
            name: file.originalname,
            url: file.location, // S3 Location URL
            key: file.key
        })) : [];

        const enquiry = await Enquiry.create({
            full_name: fullName,
            email: email,
            phone: phone,
            company_name: companyName,
            city: city,
            service: service,
            sub_service: subService,
            requirement_type: requirementType,
            requirement_desc: requirementDesc,
            expected_timeline: timeline,
            attachments: attachmentUrls,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Enquiry submitted successfully',
            data: enquiry
        });
    } catch (error) {
        console.error('Enquiry Submission Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit enquiry',
            error: error.message
        });
    }
});

module.exports = router;
