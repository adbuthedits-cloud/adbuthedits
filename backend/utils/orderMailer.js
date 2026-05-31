const { transporter, senders } = require('./emailService');

const SHOP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BRAND_NAME = 'Adbuth Productions';

/**
 * Common HTML email wrapper wrapper for a premium, consistent design.
 */
function getEmailWrapper(title, statusPill, heading, description, bodyContent) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F6FC;font-family:'Segoe UI',system-ui,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F6FC;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid #EAE6F2;overflow:hidden;box-shadow:0 8px 30px rgba(125,40,126,0.04);">
          
          <!-- Top Accent Gradient Line -->
          <tr>
            <td height="6" style="background:linear-gradient(90deg,#7D287E,#9333EA);line-height:6px;font-size:0;">&nbsp;</td>
          </tr>
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding:32px 40px 20px;background-color:#ffffff;border-bottom:1px solid #f5f3f9;">
              <img src="https://assets.adbuthverse.com/website-assets/brand/logo.png" alt="${BRAND_NAME}" style="height:48px;width:auto;display:block;margin:0 auto;image-rendering:-webkit-optimize-contrast;">
            </td>
          </tr>

          <!-- Status / Greeting Banner -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              ${statusPill}
              <h2 style="color:#1e152a;font-size:22px;margin:16px 0 0;font-weight:700;letter-spacing:-0.5px;">${heading}</h2>
              <p style="color:#6b5f7d;font-size:14px;margin:8px 0 0;line-height:1.5;">${description}</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px 40px 36px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF9FC;padding:24px 40px;border-top:1px solid #EAE6F2;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;line-height:1.6;">
                If you have any questions, feel free to reply or contact our support team.<br>
                We're always here to help!
              </p>
              <p style="color:#d1d5db;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br>
                This is an automated email. Please do not reply directly.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a premium "Order Placement Confirmation" email to the customer.
 */
async function sendOrderConfirmationEmail({ to, name, orderId, orderRef, totalAmount }) {
    const orderUrl = `${SHOP_URL}/order/${orderId}`;
    const firstName = name || 'Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #dcfce7;">
        ✨ ORDER CONFIRMED
      </span>`;

    const heading = 'Thank You for Your Order!';
    const description = 'Your payment has been verified and your order is confirmed.';

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        We have received your payment of <strong>₹${totalAmount.toLocaleString()}</strong>. Your order is confirmed and our production team is ready to begin. 
      </p>

      <!-- Order Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Order Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order ID</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${orderRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Amount Paid</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#1e152a;">₹${totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Status</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:#16a34a;">Paid & Confirmed</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Next Step Notification -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;margin-bottom:28px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="color:#5b21b6;font-size:13px;margin:0;line-height:1.6;">
              👉 <strong>What's Next?</strong> If you haven't filled in the customization form for this order yet, please visit your order page and submit the details (names, dates, music choice, etc.) so we can start work immediately.
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(125,40,126,0.25);">
              Complete Customization Form →
            </a>
          </td>
        </tr>
      </table>`;

    const html = getEmailWrapper(`Order Confirmed: #${orderRef}`, statusPill, heading, description, bodyContent);

    // 1. Send to Customer
    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Order Confirmed! #${orderRef} ✨`,
        html
    });

    console.log(`[OrderMailer] ✅ Confirmation email sent to customer: ${to}`);

    // 2. Send to Admin/Support notification
    try {
        const adminHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;color:#333;padding:20px;max-width:600px;border:1px solid #ddd;border-radius:10px;">
            <h3 style="color:#7D287E;margin-top:0;">New Order Placed! 💰</h3>
            <p>A customer has successfully placed a new order.</p>
            <table width="100%" style="font-size:14px;border-collapse:collapse;margin:20px 0;">
                <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;width:150px;">Order Reference:</td><td style="padding:8px;font-family:monospace;">#${orderRef}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Customer Name:</td><td style="padding:8px;">${firstName}</td></tr>
                <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">Customer Email:</td><td style="padding:8px;">${to}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Amount Paid:</td><td style="padding:8px;font-weight:bold;color:#10b981;">₹${totalAmount.toLocaleString()}</td></tr>
            </table>
            <p><a href="${SHOP_URL.replace('3000', '3001')}/orders/edit/${orderId}" style="display:inline-block;background:#7D287E;color:#fff;text-decoration:none;padding:10px 20px;border-radius:5px;font-weight:bold;">View in Admin Panel</a></p>
        </div>
        `;
        await transporter.sendMail({
            from: `"${BRAND_NAME} System" <${senders.system}>`,
            to: senders.support, // Admin/Support email
            subject: `[New Order] #${orderRef} — ₹${totalAmount.toLocaleString()} 💰`,
            html: adminHtml
        });
    } catch (adminMailErr) {
        console.error('[OrderMailer] Admin notification email failed:', adminMailErr.message);
    }
}

/**
 * Sends a professional light-theme "Order In Progress" email to the customer.
 */
async function sendOrderProcessingEmail({ to, name, orderId, orderRef }) {
    const orderUrl = `${SHOP_URL}/order/${orderId}`;
    const firstName = name || 'Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#faf5ff;color:#7d287e;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #f3e8ff;">
        🎨 IN PROGRESS
      </span>`;

    const heading = 'Your Order is Being Crafted!';
    const description = 'Our production team has begun customizing your order with care and precision.';

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        Great news! The customization details you submitted have been verified, and your order is now officially <strong>in progress</strong>. We are giving it our full attention to deliver the highest quality results.
      </p>

      <!-- Order Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Order Reference</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order ID</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${orderRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Current Status</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:#059669;">In Progress — Under Production</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="color:#4a3f5a;font-size:14px;margin:0 0 28px;line-height:1.7;">
        We will notify you by email as soon as your files are ready for download. You can track the real-time progress of your order at any time using the link below.
      </p>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(125,40,126,0.25);">
              Track Order Progress →
            </a>
          </td>
        </tr>
      </table>`;

    const html = getEmailWrapper(`Order In Progress: #${orderRef}`, statusPill, heading, description, bodyContent);

    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Your Order #${orderRef} is Now In Progress! 🎨`,
        html
    });

    console.log(`[OrderMailer] ✅ In-Progress email sent to: ${to}`);
}

/**
 * Sends a professional "Order Delivered" email with a 30-day download link.
 */
async function sendDeliveryEmail({ to, name, orderId, orderRef, orderUrl, expiresAt }) {
    const firstName = name || 'Customer';
    const downloadPageUrl = orderUrl || `${SHOP_URL}/order/${orderId}`;
    const expiryFormatted = expiresAt
        ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(expiresAt))
        : '30 days from today';

    const statusPill = `
      <span style="display:inline-block;background-color:#ecfdf5;color:#059669;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #d1fae5;">
        ✅ DELIVERED
      </span>`;

    const heading = 'Your Files are Ready!';
    const description = "We've completed customizing your order and your files are ready to download.";

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        We are thrilled to let you know that our creative team has finished working on your order. Your high-quality files are now available for download.
      </p>

      <!-- Order Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Order Reference</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order ID</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${orderRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Delivery Status</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#059669;">Delivered — Files Ready</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Download Available Until</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:#b45309;">${expiryFormatted}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Expiry Warning -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="color:#92400e;font-size:12px;margin:0;line-height:1.6;">
              ⚠️ <strong>Important Security Notice:</strong> For privacy and safety reasons, your download link is active for <strong>30 days</strong>. Please download and save your files to your local device before <strong>${expiryFormatted}</strong>.
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <a href="${downloadPageUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(125,40,126,0.3);">
              ⬇️ Download My Files
            </a>
          </td>
        </tr>
      </table>`;

    const html = getEmailWrapper(`Order Files Ready: #${orderRef}`, statusPill, heading, description, bodyContent);

    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Your Order #${orderRef} Files are Ready! ✅`,
        html
    });

    console.log(`[OrderMailer] ✅ Delivery email sent to: ${to}`);
}

/**
 * Sends a reassignment notification to the editor who was removed.
 */
async function sendReassignmentNotificationEmail({ to, name, orderId, newAssigneeName }) {
    const firstName = name || 'Team Member';
    const orderRef = orderId.substring(0, 8).toUpperCase();

    const statusPill = `
      <span style="display:inline-block;background-color:#fef3c7;color:#d97706;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #fde68a;">
        ⚠️ REASSIGNED
      </span>`;

    const heading = 'Order Reassigned';
    const description = 'Internal workflow assignment status update.';

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 20px;line-height:1.7;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        Order <strong style="color:#7D287E;">#${orderRef}</strong> has been reassigned to <strong>${newAssigneeName}</strong>. 
        You no longer need to work on this order. Please confirm with your supervisor if you have any questions.
      </p>
      <p style="color:#6b5f7d;font-size:13px;margin:0;line-height:1.7;">
        Thank you for your understanding.
      </p>`;

    const html = getEmailWrapper(`Order #${orderRef} Reassigned`, statusPill, heading, description, bodyContent);

    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Order #${orderRef} has been reassigned`,
        html
    });
    console.log(`[OrderMailer] ✅ Reassignment email sent to: ${to}`);
}

module.exports = { 
    sendOrderConfirmationEmail,
    sendOrderProcessingEmail, 
    sendDeliveryEmail, 
    sendReassignmentNotificationEmail 
};
