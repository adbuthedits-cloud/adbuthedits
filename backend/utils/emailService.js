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

module.exports = { transporter, senders, sendReply, isSuppressed, safeSendMail };
