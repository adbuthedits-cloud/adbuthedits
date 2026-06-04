/**
 * Premium Email Templates for Data Privacy Policy
 */

const primaryColor = '#7E22CE'; // Purple-700
const bgColor = '#F9FAFB';

const baseStyles = `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #1F2937;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
`;

const containerStyles = `
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #F3F4F6;
`;

const headerStyles = `
    background: linear-gradient(135deg, ${primaryColor} 0%, #6D28D9 100%);
    padding: 40px 20px;
    text-align: center;
`;

const contentStyles = `
    padding: 40px 30px;
`;

const footerStyles = `
    padding: 20px;
    text-align: center;
    background: #F9FAFB;
    color: #6B7280;
    font-size: 12px;
`;

/**
 * 72-Hour Warning Template
 */
const getDeletionWarningTemplate = (userName, productName, orderId) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Action Required: File Deletion Notice</title>
</head>
<body style="${baseStyles} background-color: ${bgColor}; padding: 20px;">
    <div style="${containerStyles}">
        <div style="${headerStyles}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Action Required</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Your temporary files expire in 72 hours</p>
        </div>
        
        <div style="${contentStyles}">
            <p style="font-size: 16px;">Hello ${userName || 'Valued Customer'},</p>
            
            <p>This is a friendly reminder that as part of our <strong>Privacy & Data Security Policy</strong>, the media files you uploaded for your order will be permanently deleted in <strong>3 days</strong>.</p>
            
            <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #4B5563;"><strong>Order Details:</strong></p>
                <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827;">${productName}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #6B7280;">Order ID: #${orderId.substring(0, 8)}</p>
            </div>
            
            <p>If you haven't already, please ensure you have downloaded your final delivery and saved any customization assets you might need. Once deleted, these files <strong>cannot be recovered</strong>.</p>
            
            <p style="margin-top: 30px;">Thank you for choosing Adbuth Productions!</p>
        </div>
        
        <div style="${footerStyles}">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Adbuth Productions. All rights reserved.</p>
            <p style="margin: 4px 0;">This is an automated notification regarding your account privacy.</p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Deletion Confirmed Template
 */
const getDeletionConfirmedTemplate = (userName, productName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Privacy Notice: Files Successfully Deleted</title>
</head>
<body style="${baseStyles} background-color: ${bgColor}; padding: 20px;">
    <div style="${containerStyles}">
        <div style="${headerStyles}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Privacy Secured</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Your temporary data has been removed</p>
        </div>
        
        <div style="${contentStyles}">
            <p style="font-size: 16px;">Hello ${userName || 'Valued Customer'},</p>
            
            <p>We are writing to confirm that, following our privacy policy, the temporary media files associated with your order of <strong>${productName}</strong> have been permanently deleted from our servers.</p>
            
            <p>At Adbuth Productions, we take your data privacy seriously. By removing these assets after delivery, we ensure that your personal media is not stored longer than necessary for the fulfillment of your order.</p>
            
            <p>We hope you are enjoying your digital assets! If you need further assistance, our support team is always here to help.</p>
            
            <p style="margin-top: 30px;">Warm regards,<br>The Adbuth Productions Team</p>
        </div>
        
        <div style="${footerStyles}">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Adbuth Productions. All rights reserved.</p>
            <p style="margin: 4px 0;">Your data security is our priority.</p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Review Thank You Template
 */
const getReviewThankYouTemplate = (userName, productName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thank You for Your Feedback!</title>
</head>
<body style="${baseStyles} background-color: ${bgColor}; padding: 20px;">
    <div style="${containerStyles}">
        <div style="${headerStyles}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Thank You!</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">We appreciate your review of ${productName}</p>
        </div>
        
        <div style="${contentStyles}">
            <p style="font-size: 16px;">Hello ${userName || 'Valued Customer'},</p>
            
            <p>Thank you for taking the time to share your feedback on <strong>${productName}</strong>. Your opinion is incredibly valuable to us and our community.</p>
            
            <p>We are constantly striving to deliver the highest quality digital assets and service, and your review helps us improve every day.</p>
            
            <p>If you have any further ideas, suggestions, or need additional assistance, please don't hesitate to reach out to our support team.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>The Adbuth Productions Team</p>
        </div>
        
        <div style="${footerStyles}">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Adbuth Productions. All rights reserved.</p>
            <p style="margin: 4px 0;">We value your voice.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    getDeletionWarningTemplate,
    getDeletionConfirmedTemplate,
    getReviewThankYouTemplate
};
