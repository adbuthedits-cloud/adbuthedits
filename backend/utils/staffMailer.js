const { transporter, senders } = require('./emailService');

/**
 * Sends a professional onboarding welcome email to a new staff member.
 * Includes their Employee ID, username, and a secure temporary password.
 */
async function sendStaffWelcomeEmail({ to, firstName, lastName, staffId, username, password, role }) {
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3001';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Adbuth Edits</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0a1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1025;border-radius:16px;border:1px solid #2d1b4e;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7D287E,#4a1070);padding:40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;letter-spacing:-0.5px;">Adbuth Edits</h1>
              <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:8px 0 0;">Official Onboarding Notice</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#c084fc;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Welcome Aboard</p>
              <h2 style="color:#ffffff;font-size:22px;margin:0 0 20px;font-weight:600;">
                Hello, ${firstName} ${lastName}!
              </h2>
              <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 28px;">
                You have been officially onboarded to the <strong style="color:#e9d5ff;">Adbuth Edits</strong> administrative team.
                Your account has been set up with the role of <strong style="color:#c084fc;">${roleLabel}</strong>.
                Please find your login credentials below.
              </p>

              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#130C1C;border:1px solid #2d1b4e;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;font-weight:600;">Your Login Credentials</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #1f1535;">
                          <span style="color:#6b7280;font-size:13px;display:block;">Employee ID</span>
                          <span style="color:#c084fc;font-size:16px;font-weight:700;font-family:monospace,Courier;">${staffId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #1f1535;">
                          <span style="color:#6b7280;font-size:13px;display:block;">Username</span>
                          <span style="color:#e9d5ff;font-size:16px;font-weight:600;font-family:monospace,Courier;">${username}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #1f1535;">
                          <span style="color:#6b7280;font-size:13px;display:block;">Temporary Password</span>
                          <span style="color:#fbbf24;font-size:16px;font-weight:600;font-family:monospace,Courier;">${password}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <span style="color:#6b7280;font-size:13px;display:block;">Role Assigned</span>
                          <span style="color:#a3e635;font-size:16px;font-weight:600;">${roleLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#451a1a;border:1px solid #7f1d1d;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#fca5a5;font-size:13px;margin:0;line-height:1.6;">
                      ⚠️ <strong>Security Notice:</strong> This is a temporary password. You are required to change it upon your first login.
                      Do not share this email or your credentials with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#7D287E,#4a1070);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.5px;">
                      Login to Admin Portal →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#130C1C;padding:24px 40px;border-top:1px solid #2d1b4e;text-align:center;">
              <p style="color:#4b5563;font-size:12px;margin:0;line-height:1.6;">
                © ${new Date().getFullYear()} Adbuth Edits. All rights reserved.<br>
                This is an automated email. Please do not reply to this message.
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
        from: `"Adbuth Edits" <${senders.system}>`,
        to,
        subject: `[Adbuth Edits] Welcome! Your Admin Account is Ready — ${staffId}`,
        html
    });
}

module.exports = { sendStaffWelcomeEmail };
