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

    try {
        const info = await transporter.sendMail({
            ...mailOptions,
            to: allowedRecipients.join(', '),
        });
        console.log('[Email] Message sent: %s', info.messageId);
        return info;
    } catch (err) {
        console.error('[Email] safeSendMail Primary Error:', err.message);
        // Fallback retry: if custom sender alias (e.g. noreply@adbuthverse.com) fails due to AWS SES unverified sender identity, fallback to EMAIL_USER / SMTP_USER
        const fallbackSender = process.env.EMAIL_USER || process.env.SMTP_USER;
        if (fallbackSender) {
            try {
                console.log(`[Email] Retrying email delivery via fallback sender (${fallbackSender})...`);
                const fallbackInfo = await transporter.sendMail({
                    ...mailOptions,
                    from: `"Adbuth Verse" <${fallbackSender}>`,
                    to: allowedRecipients.join(', '),
                });
                console.log('[Email] Fallback message sent: %s', fallbackInfo.messageId);
                return fallbackInfo;
            } catch (fallbackErr) {
                console.error('[Email] Fallback send failed:', fallbackErr.message);
            }
        }
        throw err;
    }
};

/**
 * Sends a professional automated confirmation email to users submitting contact, enquiry, or get-in-touch forms.
 */
const sendFormConfirmationEmail = async ({ to, name, formType }) => {
    if (!to) return;
    const recipientName = name || 'Valued Customer';
    const senderEmail = senders.support || process.env.EMAIL_USER || 'support@adbuthverse.com';
    const TRANSPARENT_LOGO_URL = 'https://assets.adbuthverse.com/brand/AdbuthVerse%20(1)_1785841733705.png';
    const logoUrl = TRANSPARENT_LOGO_URL;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Received Your Request - Adbuth Verse</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">
          
          <!-- Top Accent Line -->
          <tr>
            <td height="4" style="background:#7D287E;line-height:4px;font-size:0;">&nbsp;</td>
          </tr>
          
          <!-- Brand Header (Clean logo, no table box header) -->
          <tr>
            <td align="center" style="padding:28px 40px 12px;background-color:#ffffff;">
              <img src="${logoUrl}" alt="Adbuth Verse" style="max-height:68px;height:68px;width:auto;max-width:260px;display:block;margin:0 auto;image-rendering:-webkit-optimize-contrast;">
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <span style="display:inline-block;background-color:#FAF5FF;color:#7D287E;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #F3E8FF;">
                📨 REQUEST RECEIVED
              </span>
              <h1 style="color:#1E152A;font-size:24px;margin:16px 0 0;font-weight:700;letter-spacing:-0.5px;">We've Received Your Submission</h1>
              <p style="color:#6B5F7D;font-size:14px;margin:8px 0 0;line-height:1.5;">Thank you for contacting Adbuth Verse Post Production Studio.</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px 40px 36px;">
              <p style="color:#4A3F5A;font-size:15px;margin:0 0 20px;line-height:1.7;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="color:#4A3F5A;font-size:14px;margin:0 0 24px;line-height:1.7;">
                Thank you for reaching out to <strong>Adbuth Verse</strong>. We have successfully logged your ${formType ? `<strong>${formType}</strong>` : 'inquiry'}.
              </p>

              <!-- Response Timeframe Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5FF;border-left:4px solid #7D287E;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0;font-size:14px;color:#581C87;font-weight:700;">⏱️ Response Window:</p>
                    <p style="margin:6px 0 0 0;font-size:13px;color:#6B21A8;line-height:1.6;">
                      Our client success team reviews incoming messages continuously and will respond within <strong>24 business hours</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color:#4A3F5A;font-size:14px;margin:0 0 24px;line-height:1.7;">
                If you have additional project details, reference links, or asset specifications to add, feel free to reply directly to this email.
              </p>

              <p style="color:#4A3F5A;font-size:14px;margin:0;line-height:1.7;">
                Thank you for reaching out. We look forward to assisting you!<br><br>
                Warmest regards & sincere thanks,<br>
                <strong style="color:#7D287E;">The Adbuth Verse Support Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF9FC;padding:24px 40px;border-top:1px solid #EAE6F2;text-align:center;">
              <p style="color:#9CA3AF;font-size:12px;margin:0 0 6px;line-height:1.6;">
                Sent from <a href="mailto:${senderEmail}" style="color:#7D287E;text-decoration:none;font-weight:600;">${senderEmail}</a>
              </p>
              <p style="color:#D1D5DB;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} Adbuth Verse. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
