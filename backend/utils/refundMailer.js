const { transporter, senders } = require('./emailService');
const TRANSPARENT_LOGO_URL = 'https://assets.adbuthverse.com/brand/AdbuthVerse%20(1)_1785841733705.png';
const { getBrandLogoUrl } = require('./brandSettings');

const primaryColor = '#7D287E';
const accentGradient = 'linear-gradient(90deg, #7D287E, #9333EA)';
const bgColor = '#F8F6FC';
const containerBorder = '#EAE6F2';

/**
 * Master layout wrapper for refund & change request emails
 */
async function buildRefundEmailWrapper({ title, statusPill, heading, description, bodyContent, logoUrlOverride = null }) {
    const logoUrl = TRANSPARENT_LOGO_URL;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:20px;background-color:#ffffff;font-family:'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">

    <!-- Top Accent Line -->
    <div style="height:4px;background:#7D287E;font-size:0;line-height:0;"></div>

    <!-- Header (Brand Logo) -->
    <div style="padding:28px 40px 12px;background-color:#ffffff;text-align:center;">
      <img src="${logoUrl}" alt="Adbuth Verse" style="max-height:68px;height:68px;width:auto;max-width:260px;display:inline-block;border:0;outline:none;">
    </div>

    <!-- Banner / Heading -->
    <div style="padding:32px 40px 0;text-align:center;">
      ${statusPill || ''}
      <h1 style="color:#1E152A;font-size:24px;margin:16px 0 0;font-weight:700;letter-spacing:-0.5px;">${heading}</h1>
      ${description ? `<p style="color:#6B5F7D;font-size:14px;margin:8px 0 0;line-height:1.5;">${description}</p>` : ''}
    </div>

    <!-- Body Content -->
    <div style="padding:28px 40px 36px;">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div style="background-color:#FAF9FC;padding:24px 40px;border-top:1px solid ${containerBorder};text-align:center;">
      <p style="color:#9CA3AF;font-size:12px;margin:0 0 6px;line-height:1.6;">
        Need help or have questions regarding your order? Reply directly to this email or contact support.<br>
        Payments and refunds are securely processed via Razorpay.
      </p>
      <p style="color:#D1D5DB;font-size:11px;margin:0;">
        © ${new Date().getFullYear()} Adbuth Verse. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Send Refund Notification Email (Approved or Rejected)
 */
const sendRefundEmail = async ({ to, name, orderId, refundAmount, status, reason }) => {
    try {
        const orderRef = orderId ? orderId.substring(0, 8).toUpperCase() : 'N/A';
        const isApproved = status === 'approved';
        const customerName = name || 'Valued Customer';
        const subject = isApproved 
            ? `Refund Confirmed: Order #${orderRef}`
            : `Update on your refund request: Order #${orderRef}`;

        const statusPill = isApproved ? `
          <span style="display:inline-block;background-color:#ECFDF5;color:#059669;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #D1FAE5;">
            💰 REFUND PROCESSED
          </span>` : `
          <span style="display:inline-block;background-color:#FEF2F2;color:#DC2626;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #FCA5A5;">
            ⛔ REFUND REQUEST UPDATE
          </span>`;

        const heading = isApproved ? 'Refund Successfully Processed' : 'Refund Request Status Update';
        const description = isApproved 
            ? `Your refund for Order #${orderRef} has been issued.`
            : `We have completed reviewing your refund request for Order #${orderRef}.`;

        const bodyContent = `
          <p style="color:#4A3F5A;font-size:15px;margin:0 0 20px;line-height:1.7;">
            Hello <strong>${customerName}</strong>,
          </p>
          
          ${isApproved ? `
            <p style="color:#4A3F5A;font-size:14px;margin:0 0 24px;line-height:1.7;">
              We are writing to confirm that a refund of <strong>₹${refundAmount ? refundAmount.toLocaleString() : '0'}</strong> has been successfully processed for your order.
            </p>

            <!-- Refund Breakdown Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9FC;border:1px solid #F3E8FF;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;">
                  <p style="color:#9CA3AF;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Refund Breakdown</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4A3F5A;">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #F3E8FF;font-weight:500;color:#6B5F7D;">Order Reference</td>
                      <td style="padding:8px 0;border-bottom:1px solid #F3E8FF;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${orderRef}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #F3E8FF;font-weight:500;color:#6B5F7D;">Refund Amount</td>
                      <td style="padding:8px 0;border-bottom:1px solid #F3E8FF;text-align:right;font-weight:700;color:#059669;">₹${refundAmount ? refundAmount.toLocaleString() : '0'}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;font-weight:500;color:#6B5F7D;">Estimated Processing Window</td>
                      <td style="padding:8px 0;text-align:right;font-weight:700;color:#1E152A;">5–7 Business Days</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Apology Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#5B21B6;font-size:13px;margin:0;line-height:1.6;">
                    <strong>ℹ️ Sincere Apology:</strong> We deeply apologize that your initial experience or product deliverables did not completely fulfill your expectations. We appreciate your feedback as it helps us improve.
                  </p>
                </td>
              </tr>
            </table>
          ` : `
            <p style="color:#4A3F5A;font-size:14px;margin:0 0 24px;line-height:1.7;">
              Our administrative and support team has thoroughly reviewed your refund request for order <strong>#${orderRef}</strong>.
            </p>
            <p style="color:#4A3F5A;font-size:14px;margin:0 0 24px;line-height:1.7;">
              Unfortunately, we are unable to approve your refund request at this time based on our standard service guidelines.
            </p>

            <!-- Rejection Reason Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0;font-size:14px;color:#991B1B;font-weight:700;">Reason for Decision:</p>
                  <p style="margin:6px 0 0 0;font-size:13px;color:#B91C1C;line-height:1.6;">
                    ${reason || 'The request does not meet our refund policy terms (e.g. customized digital media already generated and downloaded).'}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Empathetic Apology Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#92400E;font-size:13px;margin:0;line-height:1.6;">
                    <strong>ℹ️ Sincere Apology:</strong> We sincerely apologize for any disappointment this decision may cause. If you have additional details or feel there are special circumstances to share, please reply directly to this support email so we can re-evaluate.
                  </p>
                </td>
              </tr>
            </table>
          `}

          <p style="color:#4A3F5A;font-size:14px;margin:0;line-height:1.7;">
            Thank you for your patience and understanding.<br><br>
            Warmest regards & sincere thanks,<br>
            <strong style="color:#7D287E;">The Adbuth Verse Support Team</strong>
          </p>`;

        const html = await buildRefundEmailWrapper({ title: subject, statusPill, heading, description, bodyContent });

        const info = await transporter.sendMail({
            from: `"Adbuth Verse Support" <${senders.support}>`,
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
        const orderRef = orderId ? orderId.substring(0, 8).toUpperCase() : 'N/A';
        const isCompleted = status === 'completed';
        const customerName = name || 'Valued Customer';
        const subject = isCompleted
            ? `Edits Completed: Your template is ready! (#${orderRef})`
            : `Change Request Received: Order #${orderRef}`;

        const statusPill = isCompleted ? `
          <span style="display:inline-block;background-color:#ECFDF5;color:#059669;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #D1FAE5;">
            ✨ EDITS COMPLETED
          </span>` : `
          <span style="display:inline-block;background-color:#FAF5FF;color:#7D287E;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #F3E8FF;">
            📝 CHANGE REQUEST RECEIVED
          </span>`;

        const heading = isCompleted ? 'Your Custom Edits are Ready!' : 'Change Request Successfully Received';
        const description = isCompleted
            ? `Our creative team has finished making the requested updates to Order #${orderRef}.`
            : `We have received your requested revisions for Order #${orderRef}.`;

        const bodyContent = `
          <p style="color:#4A3F5A;font-size:15px;margin:0 0 20px;line-height:1.7;">
            Hello <strong>${customerName}</strong>,
          </p>
          
          ${isCompleted ? `
            <p style="color:#4A3F5A;font-size:14px;margin:0 0 24px;line-height:1.7;">
              We are excited to inform you that our post-production design team has completed all the customization changes you requested for Order <strong>#${orderRef}</strong>!
            </p>
            <p style="color:#4A3F5A;font-size:14px;margin:0 0 28px;line-height:1.7;">
              You can now view and download your updated high-resolution files from your order management portal.
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${process.env.FRONTEND_URL || 'https://www.adbuthverse.com'}/order/${orderId}" 
                     style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(125,40,126,0.25);">
                    View & Download Updated Files →
                  </a>
                </td>
              </tr>
            </table>
          ` : `
            <p style="color:#4A3F5A;font-size:14px;margin:0 0 24px;line-height:1.7;">
              We have received your request for edits to Order <strong>#${orderRef}</strong>. Our senior editor has been assigned and is reviewing your specifications.
            </p>
            
            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9FC;border:1px solid #F3E8FF;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;">
                  <p style="color:#9CA3AF;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Submitted Request Details</p>
                  <p style="margin:0;font-size:14px;color:#1E152A;white-space:pre-line;line-height:1.6;">${details || 'General edit and revision request.'}</p>
                </td>
              </tr>
            </table>

            <!-- Turnaround Time Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#5B21B6;font-size:13px;margin:0;line-height:1.6;">
                    ⏱️ <strong>Expected Turnaround:</strong> Revisions are typically processed within <strong>24–48 business hours</strong>. We will notify you by email as soon as your revised render is ready.
                  </p>
                </td>
              </tr>
            </table>
          `}

          <p style="color:#4A3F5A;font-size:14px;margin:0;line-height:1.7;">
            Thank you for choosing Adbuth Verse. We appreciate your collaboration!<br><br>
            Warmest regards & sincere thanks,<br>
            <strong style="color:#7D287E;">The Adbuth Verse Design Team</strong>
          </p>`;

        const html = await buildRefundEmailWrapper({ title: subject, statusPill, heading, description, bodyContent });

        const info = await transporter.sendMail({
            from: `"Adbuth Verse Design" <${senders.support}>`,
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
