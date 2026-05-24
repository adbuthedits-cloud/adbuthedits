const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const BUCKET = process.env.R2_PUBLIC_BUCKET || 'adbuth-public';

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function main() {
    console.log('Connecting to R2 bucket:', BUCKET);
    let token;
    let counts = { png: 0, jpg: 0, jpeg: 0, webp: 0, mp4_orig: 0, mp4_web: 0, other: 0 };
    let total = 0;

    do {
        const res = await r2.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            ContinuationToken: token,
        }));
        for (const obj of res.Contents || []) {
            total++;
            const key = obj.Key.toLowerCase();
            if (key.endsWith('.webp')) counts.webp++;
            else if (key.endsWith('_web.mp4')) counts.mp4_web++;
            else if (key.endsWith('.mp4')) counts.mp4_orig++;
            else if (key.endsWith('.png')) counts.png++;
            else if (key.endsWith('.jpg')) counts.jpg++;
            else if (key.endsWith('.jpeg')) counts.jpeg++;
            else counts.other++;
        }
        token = res.NextContinuationToken;
    } while (token);

    console.log('\nAsset counts in R2:');
    console.log('Total files:', total);
    console.log(JSON.stringify(counts, null, 2));
}

main().catch(console.error);
