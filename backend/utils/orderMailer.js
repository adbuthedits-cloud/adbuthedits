const { transporter, senders } = require('./emailService');

const SHOP_URL = process.env.FRONTEND_URL || 'https://www.adbuthverse.com';
const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.adbuthverse.com';
const BRAND_NAME = 'Adbuth Verse';

const TRANSPARENT_LOGO_URL = 'https://assets.adbuthverse.com/brand/AdbuthVerse%20(1)_1785841733705.png';
const { getBrandLogoUrl } = require('./brandSettings');

/**
 * Common HTML email wrapper for a premium, consistent design.
 */
async function getEmailWrapper(title, statusPill, heading, description, bodyContent, logoUrlOverride = null) {
    const logoUrl = TRANSPARENT_LOGO_URL;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:20px;background-color:#ffffff;font-family:'Segoe UI',system-ui,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">

    <!-- Top Accent Line -->
    <div style="height:4px;background:#7D287E;font-size:0;line-height:0;"></div>

    <!-- Brand Header (Clean logo) -->
    <div style="padding:28px 40px 12px;background-color:#ffffff;text-align:center;">
      <img src="${logoUrl}" alt="${BRAND_NAME}" style="max-height:68px;height:68px;width:auto;max-width:260px;display:inline-block;border:0;outline:none;">
    </div>

    <!-- Status Banner -->
    <div style="padding:32px 40px 0;text-align:center;">
      ${statusPill || ''}
      <h2 style="color:#1e152a;font-size:22px;margin:16px 0 0;font-weight:700;letter-spacing:-0.5px;">${heading}</h2>
      ${description ? `<p style="color:#6b5f7d;font-size:14px;margin:8px 0 0;line-height:1.5;">${description}</p>` : ''}
    </div>

    <!-- Content Body -->
    <div style="padding:28px 40px 36px;">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div style="background-color:#FAF9FC;padding:24px 40px;border-top:1px solid #EAE6F2;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;line-height:1.6;">
        If you have any questions, feel free to reply directly to this email or contact our support team.<br>
        We're always here to assist you!
      </p>
      <p style="color:#d1d5db;font-size:11px;margin:0;">
        © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br>
        Official Notification &amp; Order Services
      </p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Sends a premium "Order Placement Confirmation" email to the customer & admin alert.
 */
async function sendOrderConfirmationEmail({ to, name, orderId, orderRef, totalAmount, items = [] }) {
    const orderUrl = `${SHOP_URL}/order/${orderId}`;
    const firstName = name || 'Valued Customer';
    const formattedRef = orderRef ? orderRef.toString().toUpperCase() : orderId.substring(0, 8).toUpperCase();

    const itemsTableHtml = Array.isArray(items) && items.length > 0 ? `
      <tr>
        <td colspan="2" style="padding:12px 0 8px;border-bottom:1px solid #f3e8ff;font-weight:700;color:#7D287E;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;">Order Items Breakdown</td>
      </tr>
      ${items.map(item => `
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#4a3f5a;">${item.title} <span style="color:#9ca3af;">(x${item.quantity || 1})</span></td>
          <td style="padding:6px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#1e152a;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
        </tr>
      `).join('')}
    ` : '';

    const statusPill = `
      <span style="display:inline-block;background-color:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #dcfce7;">
        ✨ ORDER CONFIRMED
      </span>`;

    const heading = 'Thank You for Your Order!';
    const description = 'Your payment has been successfully verified and your order is confirmed.';

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:15px;margin:0 0 20px;line-height:1.7;">
        Hello <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        We have received your payment of <strong>₹${totalAmount.toLocaleString()}</strong>. Thank you for placing your order with <strong>Adbuth Verse</strong>! Our creative production team is ready to begin customizing your project.
      </p>

      <!-- Order Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Complete Order Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order Reference</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${formattedRef}</td>
              </tr>
              ${itemsTableHtml}
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Total Amount Paid</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#1e152a;">₹${totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Payment Status</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:#16a34a;">Verified & Paid</td>
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
              👉 <strong>Important Next Step:</strong> If you haven't submitted your customization details (names, dates, music selection, media assets), please click the button below to complete your order form so we can start production without delay.
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(125,40,126,0.25);">
              Complete Customization Form →
            </a>
          </td>
        </tr>
      </table>

      <p style="color:#4a3f5a;font-size:14px;margin:0;line-height:1.7;">
        Thank you again for choosing Adbuth Verse. We are thrilled to craft something exceptional for you!<br><br>
        Warmest regards & sincere thanks,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    const html = await getEmailWrapper(`Order Confirmed: #${formattedRef}`, statusPill, heading, description, bodyContent);

    // 1. Send to Customer
    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Order Confirmed! #${formattedRef} ✨`,
        html
    });

    console.log(`[OrderMailer] ✅ Confirmation email sent to customer: ${to}`);

    // 2. Send to Admin/Support notification
    try {
        const adminStatusPill = `
          <span style="display:inline-block;background-color:#eff6ff;color:#2563eb;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #bfdbfe;">
            💰 NEW ORDER ALERT
          </span>`;

        const adminBodyContent = `
          <p style="color:#4a3f5a;font-size:15px;margin:0 0 20px;line-height:1.7;">
            Hello Admin Team,
          </p>
          <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
            A new order has been successfully placed and paid by a customer on Adbuth Verse.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:28px;">
            <tr>
              <td style="padding:20px;">
                <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Customer & Transaction Details</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order Reference</td>
                    <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${formattedRef}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Customer Name</td>
                    <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#1e152a;">${firstName}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Customer Email</td>
                    <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:600;color:#2563eb;">${to}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Amount Received</td>
                    <td style="padding:8px 0;text-align:right;font-weight:700;color:#16a34a;">₹${totalAmount.toLocaleString()}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${ADMIN_URL}/orders/edit/${orderId}" style="display:inline-block;background:#7D287E;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:10px;font-size:14px;font-weight:700;">
                  View Order in Admin Panel →
                </a>
              </td>
            </tr>
          </table>`;

        const adminHtml = await getEmailWrapper(`New Order #${formattedRef}`, adminStatusPill, 'New Order Received! 💰', `Order #${formattedRef} placed by ${firstName}`, adminBodyContent);

        await transporter.sendMail({
            from: `"${BRAND_NAME} System" <${senders.system}>`,
            to: senders.support,
            subject: `[New Order] #${formattedRef} — ₹${totalAmount.toLocaleString()} 💰`,
            html: adminHtml
        });
    } catch (adminMailErr) {
        console.error('[OrderMailer] Admin notification email failed:', adminMailErr.message);
    }
}

/**
 * Sends a professional "Order In Progress" email to the customer.
 */
async function sendOrderProcessingEmail({ to, name, orderId, orderRef }) {
    const orderUrl = `${SHOP_URL}/order/${orderId}`;
    const firstName = name || 'Valued Customer';
    const formattedRef = orderRef ? orderRef.toString().toUpperCase() : orderId.substring(0, 8).toUpperCase();

    const statusPill = `
      <span style="display:inline-block;background-color:#faf5ff;color:#7d287e;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #f3e8ff;">
        🎨 IN PROGRESS
      </span>`;

    const heading = 'Your Order is Being Crafted!';
    const description = 'Our production team has begun customizing your order with care and precision.';

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:15px;margin:0 0 20px;line-height:1.7;">
        Hello <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        Great news! The customization details you submitted have been verified by our design team, and your order is now officially <strong>in progress</strong>.
      </p>

      <!-- Order Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Order Reference</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order Reference</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${formattedRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Production Status</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:#059669;">Under Production — In Progress</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Apology / Patience Note -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;margin-bottom:28px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="color:#5b21b6;font-size:13px;margin:0;line-height:1.6;">
              <strong>ℹ️ Note & Apology:</strong> We apologize for any waiting time during production. Creating bespoke high-resolution assets requires thorough attention to detail. We will notify you immediately once your files are ready.
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(125,40,126,0.25);">
              Track Order Progress →
            </a>
          </td>
        </tr>
      </table>

      <p style="color:#4a3f5a;font-size:14px;margin:0;line-height:1.7;">
        Thank you for your patience and for choosing Adbuth Verse!<br><br>
        Warmest regards,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Production Team</strong>
      </p>`;

    const html = await getEmailWrapper(`Order In Progress: #${formattedRef}`, statusPill, heading, description, bodyContent);

    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Your Order #${formattedRef} is Now In Progress! 🎨`,
        html
    });

    console.log(`[OrderMailer] ✅ In-Progress email sent to: ${to}`);
}

/**
 * Sends a professional "Order Delivered" email with download link.
 */
async function sendDeliveryEmail({ to, name, orderId, orderRef, orderUrl, expiresAt }) {
    const firstName = name || 'Valued Customer';
    const downloadPageUrl = orderUrl || `${SHOP_URL}/order/${orderId}`;
    const formattedRef = orderRef ? orderRef.toString().toUpperCase() : orderId.substring(0, 8).toUpperCase();
    const expiryFormatted = expiresAt
        ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(expiresAt))
        : '30 days from today';

    const statusPill = `
      <span style="display:inline-block;background-color:#ecfdf5;color:#059669;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #d1fae5;">
        ✅ DELIVERED
      </span>`;

    const heading = 'Your Custom Files are Ready!';
    const description = "Our team has completed your order. Your high-resolution deliverables are ready for download.";

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:15px;margin:0 0 20px;line-height:1.7;">
        Hello <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        We are thrilled to let you know that our creative post-production team has finished working on your order! Your final digital files are now available for download.
      </p>

      <!-- Order Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Delivery Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order Reference</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${formattedRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Delivery Status</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#059669;">Delivered — Files Ready</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Download Window Ends</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:#b45309;">${expiryFormatted}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Expiry / Security Notice -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
              ⚠️ <strong>Security Notice & Apology:</strong> We apologize for enforcing a 30-day download window, but doing so protects your privacy and data security. Please download and save your files to your local device before <strong>${expiryFormatted}</strong>.
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${downloadPageUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(125,40,126,0.3);">
              ⬇️ Download My Files
            </a>
          </td>
        </tr>
      </table>

      <p style="color:#4a3f5a;font-size:14px;margin:0;line-height:1.7;">
        Thank you for choosing Adbuth Verse! We hope you love your completed deliverables.<br><br>
        Warmest regards & sincere thanks,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    const html = await getEmailWrapper(`Order Files Ready: #${formattedRef}`, statusPill, heading, description, bodyContent);

    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Your Order #${formattedRef} Files are Ready! ✅`,
        html
    });

    console.log(`[OrderMailer] ✅ Delivery email sent to: ${to}`);
}

/**
 * Sends a reassignment notification to the editor who was removed.
 */
async function sendReassignmentNotificationEmail({ to, name, orderId, newAssigneeName }) {
    const firstName = name || 'Team Member';
    const orderRef = orderId ? orderId.substring(0, 8).toUpperCase() : 'N/A';

    const statusPill = `
      <span style="display:inline-block;background-color:#fef3c7;color:#d97706;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #fde68a;">
        ⚠️ REASSIGNED
      </span>`;

    const heading = 'Order Workflow Reassignment';
    const description = 'Internal order workflow assignment update.';

    const bodyContent = `
      <p style="color:#4a3f5a;font-size:15px;margin:0 0 20px;line-height:1.7;">
        Hello <strong>${firstName}</strong>,
      </p>
      <p style="color:#4a3f5a;font-size:14px;margin:0 0 24px;line-height:1.7;">
        This notification is to inform you that Order <strong style="color:#7D287E;">#${orderRef}</strong> has been reassigned to <strong>${newAssigneeName || 'another team editor'}</strong>.
      </p>

      <!-- Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;border:1px solid #f3e8ff;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Reassignment Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a3f5a;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;font-weight:500;color:#6b5f7d;">Order Reference</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${orderRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:500;color:#6b5f7d;">Newly Assigned To</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:#1e152a;">${newAssigneeName || 'Designate Editor'}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Apology Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
              <strong>ℹ️ Note & Apology:</strong> We apologize for any inconvenience or workflow disruption this change may cause. You are no longer required to edit this specific order. Please reach out to your team supervisor if you have any questions.
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#4a3f5a;font-size:14px;margin:0;line-height:1.7;">
        Thank you for your hard work and dedication!<br><br>
        Warm regards,<br>
        <strong style="color:#7D287E;">Adbuth Verse Studio Management</strong>
      </p>`;

    const html = await getEmailWrapper(`Order #${orderRef} Reassigned`, statusPill, heading, description, bodyContent);

    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Order #${orderRef} has been reassigned`,
        html
    });
    console.log(`[OrderMailer] ✅ Reassignment email sent to: ${to}`);
}

module.exports = { 
    getEmailWrapper,
    sendOrderConfirmationEmail,
    sendOrderProcessingEmail, 
    sendDeliveryEmail, 
    sendReassignmentNotificationEmail 
};
