const nodemailer = require('nodemailer');

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

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('[Email] Transporter configuration error:', error);
    } else {
        console.log('[Email] Server is ready to send messages');
    }
});

// Configure different sending addresses based on service type
const senders = {
    support: process.env.SMTP_SUPPORT_EMAIL || process.env.EMAIL_USER,
    orders: process.env.SMTP_ORDERS_EMAIL || process.env.EMAIL_USER,
    system: process.env.SMTP_SYSTEM_EMAIL || process.env.EMAIL_USER,
};

const sendReply = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Adbuth Support" <${senders.support}>`,
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

module.exports = { transporter, senders, sendReply };
