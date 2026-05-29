const { transporter, senders } = require('./emailService');

const SHOP_URL = process.env.SHOP_URL || 'http://localhost:3000';
const BRAND_NAME = 'Adbuth Edits';

/**
 * Sends a professional light-theme "Order In Progress" email to the customer.
 */
async function sendOrderProcessingEmail({ to, name, orderId, orderRef }) {
    const orderUrl = `${SHOP_URL}/order/${orderId}`;
    const firstName = name || 'Valued Customer';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order is Being Processed</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid #e5deff;overflow:hidden;box-shadow:0 4px 24px rgba(125,40,126,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7D287E,#4a1070);padding:40px;text-align:center;">
              <img src="${SHOP_URL}/images/logo.png" alt="${BRAND_NAME}" style="height:60px;width:auto;margin-bottom:12px;filter:brightness(0) invert(1);">
              <h1 style="color:#ffffff;font-size:26px;margin:0;font-weight:700;letter-spacing:-0.5px;">${BRAND_NAME}</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">Professional Order Processing</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background:#faf7ff;padding:24px 40px;text-align:center;border-bottom:1px solid #ede9fe;">
              <div style="display:inline-block;background:#7D287E;color:#ffffff;font-size:13px;font-weight:600;padding:6px 20px;border-radius:100px;letter-spacing:0.5px;margin-bottom:12px;">
                🎨 IN PROGRESS
              </div>
              <h2 style="color:#1a0a2e;font-size:22px;margin:0;font-weight:700;">Your Order is Being Crafted!</h2>
              <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">Our team has started working on your request with care and precision.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#4b5563;font-size:14px;margin:0 0 24px;line-height:1.8;">
                Hi <strong style="color:#1a0a2e;">${firstName}</strong>,
              </p>
              <p style="color:#4b5563;font-size:14px;margin:0 0 24px;line-height:1.8;">
                Great news! Your order is now being processed by our skilled creative team and is currently <strong style="color:#7D287E;">in progress</strong>. We're giving it our full attention to ensure the best possible result.
              </p>

              <!-- Order Reference Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7ff;border:1px solid #ede9fe;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:600;">Order Reference</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                          <span style="color:#6b7280;font-size:13px;">Order ID</span><br>
                          <span style="color:#7D287E;font-size:15px;font-weight:700;font-family:monospace;">#${orderRef}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <span style="color:#6b7280;font-size:13px;">Current Status</span><br>
                          <span style="color:#059669;font-size:15px;font-weight:700;">🟢 In Progress — Our team is working on your order</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#4b5563;font-size:14px;margin:0 0 28px;line-height:1.8;">
                You'll receive another notification when your order is ready and delivered. In the meantime, you can track the real-time progress of your order anytime by clicking the button below.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#4a1070);color:#ffffff;text-decoration:none;padding:14px 44px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.5px;">
                      View Order Progress →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;line-height:1.6;">
                If you have any questions, feel free to reach out to us.<br>
                We're happy to help!
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
    const firstName = name || 'Valued Customer';
    const downloadPageUrl = orderUrl || `${SHOP_URL}/order/${orderId}`;
    const expiryFormatted = expiresAt
        ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(expiresAt))
        : '30 days from today';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Delivered!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid #e5deff;overflow:hidden;box-shadow:0 4px 24px rgba(125,40,126,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7D287E,#4a1070);padding:40px;text-align:center;">
              <img src="${SHOP_URL}/images/logo.png" alt="${BRAND_NAME}" style="height:60px;width:auto;margin-bottom:12px;filter:brightness(0) invert(1);">
              <h1 style="color:#ffffff;font-size:26px;margin:0;font-weight:700;letter-spacing:-0.5px;">${BRAND_NAME}</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">Your Order is Ready!</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background:#faf7ff;padding:28px 40px;text-align:center;border-bottom:1px solid #ede9fe;">
              <div style="display:inline-block;background:#7D287E;color:#ffffff;font-size:13px;font-weight:600;padding:6px 20px;border-radius:100px;letter-spacing:0.5px;margin-bottom:12px;">
                ✅ DELIVERED
              </div>
              <h2 style="color:#1a0a2e;font-size:22px;margin:0;font-weight:700;">Your Files are Ready to Download!</h2>
              <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">We've completed your order and your files are now available.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#4b5563;font-size:14px;margin:0 0 20px;line-height:1.8;">
                Hi <strong style="color:#1a0a2e;">${firstName}</strong>,
              </p>
              <p style="color:#4b5563;font-size:14px;margin:0 0 24px;line-height:1.8;">
                We're thrilled to let you know that your order has been completed by our creative team and your files are now ready for download. Please visit your order page to access and download your files.
              </p>

              <!-- Order Reference Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7ff;border:1px solid #ede9fe;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:600;">Order Reference</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #ede9fe;">
                          <span style="color:#6b7280;font-size:13px;">Order ID</span><br>
                          <span style="color:#7D287E;font-size:15px;font-weight:700;font-family:monospace;">#${orderRef}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #ede9fe;">
                          <span style="color:#6b7280;font-size:13px;">Status</span><br>
                          <span style="color:#7D287E;font-size:15px;font-weight:700;">✅ Delivered — Files Ready</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#6b7280;font-size:13px;">Download Available Until</span><br>
                          <span style="color:#b45309;font-size:15px;font-weight:700;">⏰ ${expiryFormatted}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Expiry Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
                      ⚠️ <strong>Important:</strong> Your download link is available for <strong>30 days</strong> from the delivery date. After <strong>${expiryFormatted}</strong>, the download link will expire. Please download and save your files before then.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <a href="${downloadPageUrl}" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#4a1070);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.5px;">
                      ⬇️ Download My Files
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:13px;margin:0;text-align:center;line-height:1.6;">
                Click the button above to visit your order page and download your files.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;line-height:1.6;">
                If you have any trouble downloading your files, please contact our support team.<br>
                We're happy to help!
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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Reassigned</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid #e5deff;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#7D287E,#4a1070);padding:32px;text-align:center;">
              <img src="${SHOP_URL}/images/logo.png" alt="${BRAND_NAME}" style="height:40px;width:auto;margin-bottom:10px;filter:brightness(0) invert(1);">
              <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">${BRAND_NAME}</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:6px 0 0;">Internal Workflow Notification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#4b5563;font-size:14px;margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
              <p style="color:#4b5563;font-size:14px;margin:0 0 16px;line-height:1.8;">
                Order <strong style="color:#7D287E;">#${orderRef}</strong> has been reassigned to <strong>${newAssigneeName}</strong>. 
                You no longer need to work on this order. Please confirm with your manager if you have any questions.
              </p>
              <p style="color:#9ca3af;font-size:13px;margin:0;">Thank you for your understanding.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:18px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#d1d5db;font-size:11px;margin:0;">© ${new Date().getFullYear()} ${BRAND_NAME}. Internal use only.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
        from: `"${BRAND_NAME}" <${senders.orders}>`,
        to,
        subject: `[${BRAND_NAME}] Order #${orderRef} has been reassigned`,
        html
    });
    console.log(`[OrderMailer] ✅ Reassignment email sent to: ${to}`);
}

module.exports = { sendOrderProcessingEmail, sendDeliveryEmail, sendReassignmentNotificationEmail };
