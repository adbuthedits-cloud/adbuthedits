const { transporter, senders } = require('./emailService');
const { getBrandLogoUrl, DEFAULT_BRAND_LOGO } = require('./brandSettings');

/**
 * Sends a professional onboarding welcome email to a new staff member.
 * Includes their Employee ID, username, and a secure temporary password.
 */
async function sendStaffWelcomeEmail({ to, firstName, lastName, staffId, username, password, role }) {
    const roleLabel = role ? (role.charAt(0).toUpperCase() + role.slice(1)) : 'Staff Member';
    const adminUrl = process.env.ADMIN_URL || 'https://admin.adbuthverse.com';
    const logoUrl = await getBrandLogoUrl();
    const staffName = `${firstName || ''} ${lastName || ''}`.trim() || 'Team Member';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Adbuth Verse - Official Onboarding</title>
</head>
<body style="margin:0;padding:20px;background-color:#ffffff;font-family:'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">

    <!-- Top Accent Line -->
    <div style="height:4px;background:#7D287E;font-size:0;line-height:0;"></div>

    <!-- Header (Brand Logo) -->
    <div style="padding:28px 40px 12px;background-color:#ffffff;text-align:center;">
      <img src="${logoUrl}" alt="Adbuth Verse" style="max-height:68px;height:68px;width:auto;max-width:260px;display:inline-block;border:0;outline:none;">
    </div>

    <!-- Status Banner -->
    <div style="padding:32px 40px 0;text-align:center;">
      <span style="display:inline-block;background-color:#FAF5FF;color:#7D287E;font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;border:1px solid #F3E8FF;">
        💼 OFFICIAL ONBOARDING NOTICE
      </span>
      <h1 style="color:#1E152A;font-size:24px;margin:16px 0 0;font-weight:700;letter-spacing:-0.5px;">Welcome to the Team!</h1>
      <p style="color:#6B5F7D;font-size:14px;margin:8px 0 0;line-height:1.5;">Your administrative account and portal credentials are ready.</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 40px 36px;">
      <p style="color:#4A3F5A;font-size:15px;margin:0 0 20px;line-height:1.7;">
        Hello <strong>${staffName}</strong>,
      </p>
      <p style="color:#4A3F5A;font-size:14px;line-height:1.7;margin:0 0 24px;">
        We are thrilled to officially welcome you to the <strong>Adbuth Verse</strong> administrative and studio production team!
        Your administrative account has been set up with the role of <strong style="color:#7D287E;">${roleLabel}</strong>.
      </p>

      <!-- Credentials Box -->
      <div style="background-color:#FAF9FC;border:1px solid #F3E8FF;border-radius:12px;overflow:hidden;margin-bottom:24px;padding:20px;">
        <p style="color:#9CA3AF;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;font-weight:700;">Your Official Credentials</p>
        <div style="border-bottom:1px solid #F3E8FF;padding:10px 0;">
          <span style="color:#6B5F7D;font-size:12px;display:block;">Employee ID</span>
          <span style="color:#7D287E;font-size:16px;font-weight:700;font-family:monospace;">${staffId}</span>
        </div>
        <div style="border-bottom:1px solid #F3E8FF;padding:10px 0;">
          <span style="color:#6B5F7D;font-size:12px;display:block;">Username</span>
          <span style="color:#1E152A;font-size:16px;font-weight:700;font-family:monospace;">${username}</span>
        </div>
        <div style="border-bottom:1px solid #F3E8FF;padding:10px 0;">
          <span style="color:#6B5F7D;font-size:12px;display:block;">Temporary Password</span>
          <span style="color:#D97706;font-size:16px;font-weight:700;font-family:monospace;">${password}</span>
        </div>
        <div style="padding:10px 0;">
          <span style="color:#6B5F7D;font-size:12px;display:block;">Assigned System Role</span>
          <span style="color:#059669;font-size:15px;font-weight:700;">${roleLabel}</span>
        </div>
      </div>

      <!-- Security Notice Card -->
      <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;margin-bottom:28px;padding:16px 20px;">
        <p style="color:#92400E;font-size:13px;margin:0;line-height:1.6;">
          ⚠️ <strong>Security Notice:</strong> This is a temporary initial password. For security reasons, you will be required to update your password upon your first login. Please do not share these credentials with anyone.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${adminUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#9333EA);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(125,40,126,0.25);">
          Login to Admin Portal →
        </a>
      </div>

      <p style="color:#4A3F5A;font-size:14px;margin:0;line-height:1.7;">
        Thank you for joining our team. We are excited to collaborate with you!<br><br>
        Warmest regards,<br>
        <strong style="color:#7D287E;">The Adbuth Verse Management Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color:#FAF9FC;padding:24px 40px;border-top:1px solid #EAE6F2;text-align:center;">
      <p style="color:#9CA3AF;font-size:12px;margin:0 0 6px;line-height:1.6;">
        This is an automated internal onboarding notification.<br>
        © ${new Date().getFullYear()} Adbuth Verse. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>`;

    await transporter.sendMail({
        from: `"Adbuth Verse" <${senders.system}>`,
        to,
        subject: `[Adbuth Verse] Welcome! Your Admin Account is Ready — ${staffId}`,
        html
    });
}

module.exports = { sendStaffWelcomeEmail };
