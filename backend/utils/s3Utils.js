const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { privateS3, publicS3 } = require('../config/s3Client');

/**
 * Generate a signed URL for a file in the private bucket
 * @param {string} key - The S3 key of the file
 * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
 */
const getPrivateSignedUrl = async (key, expiresIn = 3600) => {
    if (!key) return null;
    
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_PRIVATE_BUCKET,
            Key: key,
        });
        
        return await getSignedUrl(privateS3, command, { expiresIn });
    } catch (err) {
        console.error('[S3 Utils] Error generating signed URL:', err);
        return null;
    }
};

/**
 * Recursively scan an object/array and sign any private storage URLs found.
 */
const signCustomizationData = async (data) => {
    if (typeof data === 'string') {
        return await signCustomizationUrl(data);
    } else if (Array.isArray(data)) {
        return await Promise.all(data.map(item => signCustomizationData(item)));
    } else if (data !== null && typeof data === 'object') {
        const newData = {};
        for (const [key, value] of Object.entries(data)) {
            newData[key] = await signCustomizationData(value);
        }
        return newData;
    }
    return data;
};

/**
 * Identify if a URL points to the private bucket and returns a signed version.
 */
const signCustomizationUrl = async (url) => {
    if (!url || typeof url !== 'string') return url;

    // Check if it's a private bucket URL or a legacy user-upload (which we're moving to private)
    const isPrivate = url.includes(process.env.R2_PRIVATE_BUCKET);
    const isDeliveries = url.includes('/deliveries/');
    const isUserUpload = url.includes('/user-uploads/');
    
    if (isPrivate || isDeliveries || isUserUpload) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            
            // Reconstruct the key (everything after the bucket name or the base path)
            let key = '';
            if (pathParts[0] === process.env.R2_PRIVATE_BUCKET || pathParts[0] === process.env.R2_PUBLIC_BUCKET) {
                key = pathParts.slice(1).join('/');
            } else {
                key = pathParts.join('/');
            }

            if (key) {
                const signed = await getPrivateSignedUrl(key);
                return signed || url;
            }
        } catch (e) {
            return url;
        }
    }
    
    return url;
};

/**
 * Delete a file from R2
 */
const deleteCloudFile = async (key, isPublic = false) => {
    if (!key) return;
    try {
        const command = new DeleteObjectCommand({
            Bucket: isPublic ? process.env.R2_PUBLIC_BUCKET : process.env.R2_PRIVATE_BUCKET,
            Key: key,
        });
        await (isPublic ? publicS3 : privateS3).send(command);
    } catch (err) {
        console.error('[S3 Utils] Delete Error:', err);
    }
};

/**
 * Recursively find and delete media files in customization data
 */
const deleteCustomizationMedia = async (data) => {
    if (typeof data === 'string') {
        // Only delete if it's in the private bucket and in the user-uploads folder
        if (data.includes(process.env.R2_PRIVATE_BUCKET) && data.includes('/user-uploads/')) {
            try {
                const urlObj = new URL(data);
                const pathParts = urlObj.pathname.split('/').filter(p => p);
                
                let key = '';
                if (pathParts[0] === process.env.R2_PRIVATE_BUCKET) {
                    key = pathParts.slice(1).join('/');
                } else {
                    key = pathParts.join('/');
                }

                if (key) {
                    await deleteCloudFile(key, false);
                }
            } catch (e) {
                // Silently skip if URL parsing fails
            }
        }
    } else if (Array.isArray(data)) {
        await Promise.all(data.map(item => deleteCustomizationMedia(item)));
    } else if (data !== null && typeof data === 'object') {
        await Promise.all(Object.values(data).map(value => deleteCustomizationMedia(value)));
    }
};

module.exports = {
    getPrivateSignedUrl,
    signCustomizationUrl,
    signCustomizationData,
    deleteCloudFile,
    deleteCustomizationMedia
};
