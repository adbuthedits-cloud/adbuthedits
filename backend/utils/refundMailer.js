const { transporter, senders } = require('./emailService');

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
 * Send Refund Notification Email (Approved or Rejected)
 */
const sendRefundEmail = async ({ to, name, orderId, refundAmount, status, reason }) => {
    try {
        const orderRef = orderId.substring(0, 8).toUpperCase();
        const isApproved = status === 'approved';
        const subject = isApproved 
            ? `Refund Confirmed: Order #${orderRef}`
            : `Update on your refund request: Order #${orderRef}`;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${subject}</title>
        </head>
        <body style="${baseStyles} background-color: ${bgColor}; padding: 20px;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                        ${isApproved ? 'Refund Processed' : 'Refund Request Update'}
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Order Reference: #${orderRef}</p>
                </div>
                
                <div style="${contentStyles}">
                    <p style="font-size: 16px;">Hello ${name || 'Valued Customer'},</p>
                    
                    ${isApproved ? `
                        <p>We are writing to confirm that a refund of <strong>₹${refundAmount.toLocaleString()}</strong> has been successfully processed for your order.</p>
                        <p>The refunded amount will be credited back to your original payment method. Depending on your financial institution, it usually takes <strong>5-7 working days</strong> to reflect in your account.</p>
                    ` : `
                        <p>We have reviewed your refund request for order <strong>#${orderRef}</strong>.</p>
                        <p>Unfortunately, we are unable to approve your refund request at this time.</p>
                        <div style="background: #FFF5F5; border-left: 4px solid #E53E3E; border-radius: 8px; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #C53030;"><strong>Reason for decision:</strong></p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #742A2A;">${reason || 'Does not meet refund policy guidelines.'}</p>
                        </div>
                        <p>If you have any questions or feel there is more information to share, please reply directly to this support email.</p>
                    `}
                    
                    <p style="margin-top: 30px;">Thank you for your patience and understanding.</p>
                    <p>Warm regards,<br>The Adbuth Support Team</p>
                </div>
                
                <div style="${footerStyles}">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Adbuth Productions. All rights reserved.</p>
                    <p style="margin: 4px 0;">Payments and refunds are processed securely via Razorpay.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const info = await transporter.sendMail({
            from: `"Adbuth Support" <${senders.support}>`,
            to,
            subject,
            html
        });
        console.log(`[Email] Refund email (${status}) sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Email] Error sending refund email:', error);
    }
};

/**
 * Send Change Request Status Email (Received or Completed)
 */
const sendChangeRequestEmail = async ({ to, name, orderId, status, details }) => {
    try {
        const orderRef = orderId.substring(0, 8).toUpperCase();
        const isCompleted = status === 'completed';
        const subject = isCompleted
            ? `Edits Completed: Your template is ready! (#${orderRef})`
            : `Change Request Received: Order #${orderRef}`;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${subject}</title>
        </head>
        <body style="${baseStyles} background-color: ${bgColor}; padding: 20px;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                        ${isCompleted ? 'Edits Completed!' : 'Change Request Received'}
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Order Reference: #${orderRef}</p>
                </div>
                
                <div style="${contentStyles}">
                    <p style="font-size: 16px;">Hello ${name || 'Valued Customer'},</p>
                    
                    ${isCompleted ? `
                        <p>We are excited to let you know that our design team has completed the customization changes you requested for your template order <strong>#${orderRef}</strong>.</p>
                        <p>You can now download the updated files from your order portal.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SHOP_URL || 'http://localhost:3000'}/order/${orderId}" 
                               style="background-color: ${primaryColor}; color: white; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(126,34,206,0.2);">
                               View & Download Files
                            </a>
                        </div>
                    ` : `
                        <p>We have successfully received your request for edits to your template (Order <strong>#${orderRef}</strong>).</p>
                        <p>Our design team is reviewing your requirements and will begin working on your edits. Change requests are typically processed within <strong>24-48 business hours</strong>.</p>
                        
                        <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin: 24px 0;">
                            <p style="margin: 0; font-size: 14px; color: #4B5563;"><strong>Your Request Details:</strong></p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #111827; white-space: pre-line;">${details || 'No additional details provided.'}</p>
                        </div>
                        <p>You will receive another email from us as soon as your edits are ready.</p>
                    `}
                    
                    <p style="margin-top: 30px;">Thank you for choosing Adbuth Productions!</p>
                    <p>Warm regards,<br>The Adbuth Design Team</p>
                </div>
                
                <div style="${footerStyles}">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Adbuth Productions. All rights reserved.</p>
                    <p style="margin: 4px 0;">This email is sent in response to action requested on your order.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const info = await transporter.sendMail({
            from: `"Adbuth Design" <${senders.support}>`,
            to,
            subject,
            html
        });
        console.log(`[Email] Change request email (${status}) sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Email] Error sending change request email:', error);
    }
};

module.exports = {
    sendRefundEmail,
    sendChangeRequestEmail
};
