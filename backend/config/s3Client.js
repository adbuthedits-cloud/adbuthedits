const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/**
 * PUBLIC S3 client — used for website media:
 *   product images/videos, blog images, review images/videos
 *   Bucket: R2_PUBLIC_BUCKET (adbuth-public)
 */
const publicS3 = new S3Client({
    region: 'us-east-1',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

/**
 * PRIVATE S3 client — used for fulfilled order deliveries only.
 *   All access via presigned URLs generated server-side.
 *   Bucket: R2_PRIVATE_BUCKET (adbuth-private)
 */
const privateS3 = new S3Client({
    region: 'us-east-1',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

module.exports = { publicS3, privateS3 };
