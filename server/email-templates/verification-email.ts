/**
 * Generate verification email HTML using the branded template.
 * Navy (#1a2a4a) + cream (#f2eeea) brand palette.
 * Matches password reset email styling for consistency.
 */
export function generateVerificationEmail(verificationLink: string): { html: string; text: string } {
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
</head>
<body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5">
    <tbody>
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tbody>
              <!-- Header -->
              <tr>
                <td style="background-color:#1a2a4a;padding:32px 24px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:26px;font-weight:400;letter-spacing:0.5px;">The Connection</h1>
                </td>
              </tr>
              <!-- Main content -->
              <tr>
                <td style="padding:40px 32px 32px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1c1e;font-size:16px;line-height:1.6;">
                    <!-- Headline -->
                    <tr>
                      <td style="text-align:center;padding-bottom:8px;">
                        <h2 style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:28px;font-weight:400;color:#1a2a4a;line-height:1.3;">Verify Your Email</h2>
                      </td>
                    </tr>
                    <!-- Subtext -->
                    <tr>
                      <td style="text-align:center;padding-bottom:32px;color:#6b7280;font-size:15px;">
                        Welcome to The Connection! Tap below to verify your email and get started.
                      </td>
                    </tr>
                    <!-- CTA Button -->
                    <tr>
                      <td style="text-align:center;padding-bottom:32px;">
                        <a href="${verificationLink}" style="display:inline-block;background-color:#1a2a4a;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;letter-spacing:0.3px;">Verify Email</a>
                      </td>
                    </tr>
                    <!-- Expiry notice -->
                    <tr>
                      <td style="text-align:center;padding-bottom:24px;color:#9ca3af;font-size:13px;">
                        This link expires in 3 hours.
                      </td>
                    </tr>
                    <!-- Divider -->
                    <tr>
                      <td style="padding-bottom:24px;">
                        <div style="height:1px;background-color:#e5e7eb;"></div>
                      </td>
                    </tr>
                    <!-- Fallback link -->
                    <tr>
                      <td style="padding-bottom:24px;color:#9ca3af;font-size:13px;text-align:center;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${verificationLink}" style="color:#1a2a4a;word-break:break-all;font-size:12px;">${verificationLink}</a>
                      </td>
                    </tr>
                    <!-- Mission box -->
                    <tr>
                      <td style="padding:0;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8f7f5;border-radius:8px;">
                          <tr>
                            <td style="padding:24px;text-align:center;">
                              <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;padding-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Our Mission</div>
                              <div style="color:#4b5563;font-size:14px;font-family:Georgia,'Times New Roman',Times,serif;line-height:1.6;font-style:italic;">
                                A world where believers live with clarity, conviction, and courage because they are connected to the truth and connected to each other.
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
                    <tr>
                      <td style="padding-bottom:8px;">
                        If you didn't create an account, you can safely ignore this email.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:8px;">
                        <a href="mailto:support@theconnection.app" style="color:#1a2a4a;text-decoration:none;">support@theconnection.app</a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        &copy; 2026 The Connection Media Group L.L.C.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

  const text = [
    'The Connection',
    '',
    'Verify Your Email',
    '',
    'Welcome to The Connection! Please verify your email address to complete your registration.',
    '',
    'Verify your email by visiting:',
    verificationLink,
    '',
    'This link expires in 3 hours.',
    '',
    "If you didn't create an account, you can safely ignore this email.",
    '',
    'Our Mission: A world where believers live with clarity, conviction, and courage because they are connected to the truth and connected to each other.',
    '',
    'support@theconnection.app',
    '(c) 2026 The Connection Media Group L.L.C.',
  ].join('\n');

  return { html, text };
}
