const nodemailer = require('nodemailer');
const EmailSuppression = require('../models/EmailSuppression');

// Define a centralized SMTP transporter supporting custom SMTP/SES settings
const transporter = nodemailer.createTransport(
    process.env.SMTP_HOST
        ? {
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || '465'),
              secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
              auth: {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS,
              },
          }
        : {
              service: 'gmail',
              auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
              },
          }
);

// Verify connection configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('[Email] ❌ Transporter configuration error:', {
            message: error.message,
            code: error.code,
            responseCode: error.responseCode,
            response: error.response,
            command: error.command,
        });
    } else {
        const method = process.env.SMTP_HOST ? `SMTP (${process.env.SMTP_HOST})` : 'Gmail';
        console.log(`[Email] ✅ Server ready to send via ${method} as ${process.env.SMTP_SYSTEM_EMAIL || process.env.EMAIL_USER}`);
    }
});

// Configure different sending addresses based on service type
const senders = {
    support: process.env.SMTP_SUPPORT_EMAIL || process.env.EMAIL_USER,
    orders: process.env.SMTP_ORDERS_EMAIL || process.env.EMAIL_USER,
    system: process.env.SMTP_SYSTEM_EMAIL || process.env.EMAIL_USER,
};

/**
 * Check if an email address is suppressed (bounced or complained).
 * Returns true if suppressed — caller should skip sending.
 */
const isSuppressed = async (email) => {
    try {
        const normalized = email?.toLowerCase();
        const found = await EmailSuppression.findOne({ where: { email: normalized } });
        if (found) {
            console.warn(`[Email] ⛔ Skipping suppressed email: ${normalized} (reason: ${found.reason})`);
            return true;
        }
        return false;
    } catch (err) {
        // If DB check fails, allow sending to avoid blocking all emails
        console.error('[Email] Suppression check failed (allowing send):', err.message);
        return false;
    }
};

/**
 * Send a support reply email.
 * Checks the suppression list before sending.
 */
const sendReply = async ({ to, subject, html }) => {
    if (await isSuppressed(to)) return null;
    try {
        const info = await transporter.sendMail({
            from: `"Adbuth Verse Support" <${senders.support}>`,
            to,
            subject,
            html
        });
        console.log("Support Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

/**
 * Generic safe send — checks suppression and sends any email.
 * Use this in orderMailer, otpRoutes, etc. as a drop-in replacement for transporter.sendMail
 */
const safeSendMail = async (mailOptions) => {
    const recipients = Array.isArray(mailOptions.to)
        ? mailOptions.to
        : [mailOptions.to];

    // Filter out all suppressed recipients
    const allowedRecipients = [];
    for (const email of recipients) {
        if (!(await isSuppressed(email))) {
            allowedRecipients.push(email);
        }
    }

    if (allowedRecipients.length === 0) {
        console.warn('[Email] All recipients are suppressed — email not sent.');
        return null;
    }

    const info = await transporter.sendMail({
        ...mailOptions,
        to: allowedRecipients.join(', '),
    });
    console.log('[Email] Message sent: %s', info.messageId);
    return info;
};

/**
 * Sends a professional automated confirmation email to users submitting contact, enquiry, or get-in-touch forms.
 */
const sendFormConfirmationEmail = async ({ to, name, formType }) => {
    if (!to) return;
    const recipientName = name || 'Valued Customer';
    const senderEmail = senders.support;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px; background-color: #ffffff;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f3e8ff;">
                <h1 style="color: #7D287E; margin: 0; font-size: 24px;">ADBUTH <span style="color: #EAB308;">VERSE</span></h1>
                <p style="color: #666; font-size: 13px; margin-top: 4px;">Post Production Studio & Creative Partner</p>
            </div>
            <div style="padding: 24px 0; color: #333; line-height: 1.6;">
                <p style="font-size: 16px;">Dear <strong>${recipientName}</strong>,</p>
                <p>Thank you for contacting <strong>Adbuth Verse</strong>. We have successfully received your ${formType || 'request'}.</p>
                <p>Our team is currently reviewing your message and we will reach out to you shortly to assist you further.</p>
                <div style="background-color: #f9f5ff; border-left: 4px solid #7D287E; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #7D287E; font-size: 14px; font-weight: bold;">We usually respond within 24 business hours.</p>
                </div>
                <p>If you have any urgent details to share in the meantime, feel free to reply directly to this email.</p>
            </div>
            <div style="text-align: center; border-top: 1px solid #eee; pt: 16px; margin-top: 20px; font-size: 12px; color: #888;">
                <p style="margin: 4px 0;">© ${new Date().getFullYear()} Adbuth Verse. All rights reserved.</p>
                <p style="margin: 0;">Sent from <a href="mailto:${senderEmail}" style="color: #7D287E; text-decoration: none;">${senderEmail}</a></p>
            </div>
        </div>
    `;

    try {
        await safeSendMail({
            from: `"Adbuth Verse Support" <${senderEmail}>`,
            to,
            subject: 'We Received Your Request - Adbuth Verse',
            html
        });
        console.log(`[Form Email] Sent receipt confirmation to ${to}`);
    } catch (err) {
        console.error('[Form Email] Error sending confirmation:', err.message);
    }
};

module.exports = { transporter, senders, sendReply, isSuppressed, safeSendMail, sendFormConfirmationEmail };
