/**
 * Clean & Minimal Email Templates for Data Privacy, Account Actions, Customer Engagement, & Authentication
 * Design: Pure White (#ffffff) Backgrounds, Clean Logo Placement, No Table Box Formatting
 */

const TRANSPARENT_LOGO_URL = 'https://assets.adbuthverse.com/brand/AdbuthVerse%20(1)_1785841733705.png';
const { getBrandLogoUrl } = require('./brandSettings');

const primaryColor = '#7D287E';

/**
 * Common Master Email Layout Wrapper for emailTemplates.js
 */
async function buildMasterEmail({ title, statusPill, heading, description, bodyContent, logoUrlOverride = null }) {
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

    <!-- Top Clean Border Accent -->
    <div style="height:4px;background:${primaryColor};font-size:0;line-height:0;"></div>

    <!-- Direct Brand Logo Header -->
    <div style="padding:28px 40px 12px;background-color:#ffffff;text-align:center;">
      <img src="${logoUrl}" alt="Adbuth Verse" style="max-height:68px;height:68px;width:auto;max-width:260px;display:inline-block;border:0;outline:none;">
    </div>

    <!-- Banner / Header Title -->
    <div style="padding:16px 40px 0;text-align:center;background-color:#ffffff;">
      ${statusPill || ''}
      <h1 style="color:#111827;font-size:22px;margin:14px 0 0;font-weight:700;">${heading}</h1>
      ${description ? `<p style="color:#6B7280;font-size:14px;margin:6px 0 0;line-height:1.5;">${description}</p>` : ''}
    </div>

    <!-- Content Body -->
    <div style="padding:24px 40px 32px;background-color:#ffffff;">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div style="background-color:#ffffff;padding:20px 40px;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="color:#6B7280;font-size:12px;margin:0 0 6px;line-height:1.5;">
        If you have any questions or need further assistance, please reply directly to this email or contact support.<br>
        We are always here to help you!
      </p>
      <p style="color:#9CA3AF;font-size:11px;margin:0;">
        © ${new Date().getFullYear()} Adbuth Verse. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * OTP / One-Time Password Verification Email Template
 */
async function getOtpEmailTemplate({ otp, purpose, userName, logoUrlOverride = null }) {
    const purposeLabels = {
        email_login: 'Login',
        email_verify: 'Email Verification',
        forgot_password: 'Password Reset',
        change_password_settings: 'Change Password',
        reactivate_account: 'Account Reactivation',
    };
    const label = purposeLabels[purpose] || 'Verification';
    const name = userName || 'Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#ffffff;color:#7D287E;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #7D287E;">
        🔐 SECURITY VERIFICATION
      </span>`;

    const heading = `${label} Security Code`;
    const description = `Use the one-time verification code below to complete your ${label.toLowerCase()}.`;

    const bodyContent = `
      <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        You have requested a verification code for <strong>${label}</strong> on your Adbuth Verse account. Please use the 6-digit code below to proceed:
      </p>

      <!-- Clean OTP Code Display -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#ffffff;">
        <tr>
          <td align="center">
            <div style="display:inline-block;background:#ffffff;border:2px solid #7D287E;border-radius:12px;padding:16px 36px;">
              <span style="font-size:34px;font-weight:800;letter-spacing:8px;color:#7D287E;font-family:monospace;">${otp}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Expiry Details Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px;">
            <p style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;font-weight:700;">Security Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#374151;">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #F3F4F6;font-weight:500;color:#6B7280;">Request Action</td>
                <td style="padding:6px 0;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:700;color:#111827;">${label}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:500;color:#6B7280;">Code Validity Window</td>
                <td style="padding:6px 0;text-align:right;font-weight:700;color:#7D287E;">10 Minutes</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Security Notice -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #F59E0B;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="color:#92400E;font-size:13px;margin:0;line-height:1.5;">
              <strong>⚠️ Security Alert:</strong> If you did not initiate this verification request, please ignore this email or update your account password immediately.
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
        Thank you for helping us keep your account safe!<br><br>
        Warm regards,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Security Team</strong>
      </p>`;

    return buildMasterEmail({ title: `${label} OTP - Adbuth Verse`, statusPill, heading, description, bodyContent, logoUrlOverride });
}

/**
 * 72-Hour Warning Template (File Deletion Notice)
 */
async function getDeletionWarningTemplate(userName, productName, orderId, logoUrlOverride = null) {
    const name = userName || 'Valued Customer';
    const orderRef = orderId ? orderId.substring(0, 8).toUpperCase() : 'N/A';

    const statusPill = `
      <span style="display:inline-block;background-color:#ffffff;color:#D97706;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #F59E0B;">
        ⚠️ ACTION REQUIRED
      </span>`;

    const heading = 'Temporary Files Expiry Notice';
    const description = 'Your uploaded order files are scheduled for automatic deletion in 72 hours.';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        This is a friendly reminder regarding our <strong>Data Security Policy</strong>. The temporary media files and assets you uploaded for your order will be permanently purged in <strong>3 days (72 hours)</strong>.
      </p>

      <!-- Details Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px;">
            <p style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;font-weight:700;">Order Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#374151;">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #F3F4F6;font-weight:500;color:#6B7280;">Product Name</td>
                <td style="padding:6px 0;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:700;color:#111827;">${productName || 'Custom Project'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #F3F4F6;font-weight:500;color:#6B7280;">Order Reference</td>
                <td style="padding:6px 0;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:700;color:#7D287E;font-family:monospace;">#${orderRef}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:500;color:#6B7280;">Purge Schedule</td>
                <td style="padding:6px 0;text-align:right;font-weight:700;color:#D97706;">In 72 Hours</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Privacy Notice Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #F59E0B;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="color:#92400E;font-size:13px;margin:0;line-height:1.5;">
              <strong>⚠️ Privacy Notice & Apology:</strong> We apologize for any inconvenience this policy may cause. However, removing temporary media assets after order completion protects your private files and guarantees data security. Once deleted, these files cannot be restored.
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        Please make sure you have downloaded all your completed deliverables and saved any personal assets locally.
      </p>

      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
        Thank you for choosing Adbuth Verse. We deeply appreciate your trust in us!<br><br>
        Warm regards,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    return buildMasterEmail({ title: 'Action Required: File Deletion Notice', statusPill, heading, description, bodyContent, logoUrlOverride });
}

/**
 * Deletion Confirmed Template (Files Purged Notice)
 */
async function getDeletionConfirmedTemplate(userName, productName, logoUrlOverride = null) {
    const name = userName || 'Valued Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#ffffff;color:#059669;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #10B981;">
        🔒 PRIVACY SECURED
      </span>`;

    const heading = 'Temporary Files Successfully Deleted';
    const description = 'Your privacy is protected. Uploaded media assets have been removed.';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        We are writing to confirm that, in accordance with our strict data privacy standards, the temporary media files associated with your order of <strong>${productName || 'your custom item'}</strong> have been permanently erased from our secure cloud servers.
      </p>

      <!-- Details Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #10B981;border-radius:6px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px;">
            <p style="color:#111827;font-size:13px;font-weight:700;margin:0 0 6px;">Privacy Guarantee:</p>
            <p style="color:#374151;font-size:13px;margin:0;line-height:1.5;">
              ✔ User media assets completely removed.<br>
              ✔ Zero residual file storage on cloud nodes.<br>
              ✔ Deliverables and order records remain safely archived.
            </p>
          </td>
        </tr>
      </table>

      <!-- Apology Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #7D287E;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="color:#7D287E;font-size:13px;margin:0;line-height:1.5;">
              <strong>ℹ️ Note & Apology:</strong> We apologize if deleting temporary files creates any inconvenience in re-downloading source assets. If you ever need a new custom render or additional assistance, our team is always here for you!
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
        Thank you for being a valued member of the Adbuth Verse community. We look forward to serving you again soon!<br><br>
        Warmest regards & thanks,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    return buildMasterEmail({ title: 'Privacy Secured: Files Purged', statusPill, heading, description, bodyContent, logoUrlOverride });
}

/**
 * Review Thank You Template
 */
async function getReviewThankYouTemplate(userName, productName, logoUrlOverride = null) {
    const name = userName || 'Valued Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#ffffff;color:#7D287E;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #7D287E;">
        ⭐ THANK YOU FOR YOUR REVIEW
      </span>`;

    const heading = 'We Appreciate Your Feedback!';
    const description = `Thank you for taking the time to review ${productName || 'our product'}.`;

    const bodyContent = `
      <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        Thank you so much for sharing your review for <strong>${productName || 'your recent purchase'}</strong>! Your feedback helps us continuously refine our work and helps fellow customers choose the best custom creative designs.
      </p>

      <!-- Feedback Summary Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #7D287E;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:16px;">
            <p style="color:#7D287E;font-size:15px;font-weight:700;margin:0 0 4px;">Your voice matters to us!</p>
            <p style="color:#4B5563;font-size:13px;margin:0;line-height:1.5;">
              Every review directly inspires our creators and designers to reach higher standards of excellence.
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        If you ever have ideas, custom requests, or need support with your digital deliverables, please don't hesitate to reach out.
      </p>

      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
        With sincere gratitude,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    return buildMasterEmail({ title: 'Thank You for Your Feedback!', statusPill, heading, description, bodyContent, logoUrlOverride });
}

/**
 * Account Deactivated Email Template
 */
async function getAccountDeactivatedTemplate(userName, reason, logoUrlOverride = null) {
    const name = userName || 'Valued Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#ffffff;color:#D97706;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #F59E0B;">
        ⚠️ ACCOUNT DEACTIVATED
      </span>`;

    const heading = 'Account Access Temporarily Suspended';
    const description = 'Your Adbuth Verse account has been deactivated as requested.';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        This email confirms that your Adbuth Verse account has been <strong>deactivated</strong>. Direct login access to your account is currently disabled.
      </p>

      <!-- Status Info Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #7D287E;border-radius:6px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0;font-size:14px;color:#111827;font-weight:700;">🔒 Your Data & Order History Remain Safe:</p>
            <p style="margin:6px 0 0 0;font-size:13px;color:#4B5563;line-height:1.5;">
              Your profile, order records, and past purchases are safely stored. Nothing has been permanently erased.
            </p>
          </td>
        </tr>
      </table>

      ${reason ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:6px;margin-bottom:20px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Reason Specified</p>
            <p style="margin:4px 0 0 0;font-size:14px;color:#111827;">${reason}</p>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Apology & Reactivation Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #F59E0B;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="color:#92400E;font-size:13px;margin:0;line-height:1.5;">
              <strong>ℹ️ Apology & Reactivation:</strong> We're sorry to see you go! If you ever wish to reactivate your account, simply visit our website and log in using your registered mobile number OTP. Your account will automatically reactivate instantly.
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
        Thank you for being part of Adbuth Verse.<br><br>
        Warmest regards,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    return buildMasterEmail({ title: 'Account Deactivated - Adbuth Verse', statusPill, heading, description, bodyContent, logoUrlOverride });
}

/**
 * Account Deleted Email Template (Permanent Data Loss Notice)
 */
async function getAccountDeletedTemplate(userName, reason, logoUrlOverride = null) {
    const name = userName || 'Valued Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#ffffff;color:#DC2626;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #EF4444;">
        ⛔ ACCOUNT PERMANENTLY DELETED
      </span>`;

    const heading = 'Account & Personal Data Erased';
    const description = 'Confirmation of permanent account deletion per your request.';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        This email confirms that your Adbuth Verse account and all associated personal records have been <strong>permanently deleted</strong> from our systems.
      </p>

      <!-- Warning Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #EF4444;border-radius:6px;margin-bottom:20px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:14px;color:#DC2626;font-weight:700;">⚠️ Permanent Data Loss Warning:</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:#B91C1C;line-height:1.5;">
              Your profile data, order history, transaction records, saved cart, and wishlist items have been completely deleted. This action is final and non-reversible.
            </p>
          </td>
        </tr>
      </table>

      ${reason ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:6px;margin-bottom:20px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Reason Specified</p>
            <p style="margin:4px 0 0 0;font-size:14px;color:#111827;">${reason}</p>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Apology Box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #7D287E;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="color:#7D287E;font-size:13px;margin:0;line-height:1.5;">
              <strong>ℹ️ Sincere Apology & Goodbye:</strong> We sincerely apologize if any issue led to your decision to delete your account. You are always welcome to create a new account if you wish to use our creative services in the future.
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
        Thank you for having been a valued customer of Adbuth Verse.<br><br>
        Best regards & sincere thanks,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    return buildMasterEmail({ title: 'Account Permanently Deleted - Adbuth Verse', statusPill, heading, description, bodyContent, logoUrlOverride });
}

/**
 * Account Reactivated Email Template
 */
async function getAccountReactivatedTemplate(userName, logoUrlOverride = null) {
    const name = userName || 'Valued Customer';

    const statusPill = `
      <span style="display:inline-block;background-color:#ffffff;color:#166534;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #10B981;">
        ✨ ACCOUNT REACTIVATED
      </span>`;

    const heading = 'Welcome Back to Adbuth Verse!';
    const description = 'Your account has been reactivated successfully.';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.6;">
        We are delighted to inform you that your Adbuth Verse account has been <strong>successfully reactivated</strong>!
      </p>

      <!-- Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #10B981;border-radius:6px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0;font-size:14px;color:#15803D;font-weight:700;">✅ Fully Restored Privileges:</p>
            <p style="margin:6px 0 0 0;font-size:13px;color:#374151;line-height:1.5;">
              • Full login access restored across website and services.<br>
              • Your past order history, digital assets, and profile records are active.<br>
              • You can continue customizing and placing orders seamlessly.
            </p>
          </td>
        </tr>
      </table>

      <!-- Thankful Closing -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-left:4px solid #7D287E;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="color:#7D287E;font-size:13px;margin:0;line-height:1.5;">
              <strong>💖 Thank You for Choosing Us Again:</strong> We sincerely appreciate your trust in Adbuth Verse and look forward to working with you!
            </p>
          </td>
        </tr>
      </table>

      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
        If you did not perform this reactivation, please contact support immediately.<br><br>
        Warmest regards & sincere thanks,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Team</strong>
      </p>`;

    return buildMasterEmail({ title: 'Account Reactivated Successfully - Adbuth Verse', statusPill, heading, description, bodyContent, logoUrlOverride });
}

module.exports = {
    buildMasterEmail,
    getOtpEmailTemplate,
    getDeletionWarningTemplate,
    getDeletionConfirmedTemplate,
    getReviewThankYouTemplate,
    getAccountDeactivatedTemplate,
    getAccountDeletedTemplate,
    getAccountReactivatedTemplate
};
