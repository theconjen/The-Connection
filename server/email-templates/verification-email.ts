/**
 * Generate verification email HTML using the branded template.
 * Updated to match password reset email color palette (navy #1a2a4a, cream #f2eeea).
 * The CTA points to the verification link (one-click, no code entry).
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
        <td>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#f2eeea">
            <tbody>
              <!-- Header -->
              <tr>
                <td style="background-color:#1a2a4a;padding:20px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-family:'Times New Roman',Times,serif;font-size:24px;">The Connection</h1>
                </td>
              </tr>
              <!-- Main content -->
              <tr>
                <td style="padding:30px 20px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;color:#1c1c1e;font-size:16px;line-height:1.5;text-align:center;">
                    <tr>
                      <td style="font-size:32px;font-family:'Times New Roman',Times,serif;padding-bottom:24px;color:#1a2a4a;">
                        Your Community is waiting for you...
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:16px;color:#1c1c1e;">
                        Welcome to The Connection! Please verify your email address to complete your registration and join our community.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 0;">
                        <a href="${verificationLink}" style="display:inline-block;background-color:#1a2a4a;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:18px;">Verify Email & Login</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:16px;color:#666;font-size:14px;">
                        If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
                        <a href="${verificationLink}" style="color:#1a2477;word-break:break-all;">${verificationLink}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:16px;padding-bottom:24px;color:#1c1c1e;font-size:13px;">
                        If you did not request this link, please disregard this email and contact us if you suspect fraud.
                      </td>
                    </tr>
                    <!-- Mission section -->
                    <tr>
                      <td style="padding:0;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#1a2a4a;border-radius:10px;">
                          <tr>
                            <td style="padding:30px;text-align:center;">
                              <div style="font-size:20px;font-family:'Times New Roman',Times,serif;color:#ffffff;padding-bottom:16px;">
                                What's our mission?
                              </div>
                              <div style="color:#ffffff;font-size:15px;font-family:'Times New Roman',Times,serif;line-height:1.5;">
                                A world where believers live with clarity, conviction, and courage because they are connected to the truth and connected to each other.
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Divider -->
                    <tr>
                      <td style="padding:24px 0;">
                        <div style="height:1px;background-color:#ddd;"></div>
                      </td>
                    </tr>
                    <!-- Support section -->
                    <tr>
                      <td style="font-size:14px;color:#666;">
                        Need more support?<br><br>
                        Send us an email at <strong><a href="mailto:support@theconnection.app" style="color:#1a2477;text-decoration:none;">support@theconnection.app</a></strong><br>
                        Or visit us in app on our <strong>Support Center</strong>.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px;background-color:#f2eeea;border-top:1px solid #ddd;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#666;text-align:center;line-height:1.4;">
                    <tr>
                      <td style="padding-bottom:8px;">
                        <a href="#" style="color:#666;text-decoration:underline;">CONTACT US</a> &nbsp;|&nbsp;
                        <a href="#" style="color:#666;text-decoration:underline;">MANAGE PREFERENCES</a> &nbsp;|&nbsp;
                        <a href="#" style="color:#666;text-decoration:underline;">UNSUBSCRIBE</a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        © 2026 The Connection Media Group L.L.C. All rights reserved.<br>
                        You're receiving this email because you signed up for updates from The Connection.
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
    'Your Community is waiting for you...',
    '',
    'Welcome to The Connection! Please verify your email address to complete your registration and join our community.',
    '',
    'Verify your email by visiting:',
    verificationLink,
    '',
    "If you did not request this link, please disregard this email and contact us if you suspect fraud.",
    '',
    "What's our mission?",
    "A world where believers live with clarity, conviction, and courage because they are connected to the truth and connected to each other.",
    '',
    'Need more support?',
    'Send us an email at support@theconnection.app or visit us in app on our Support Center.',
    '',
    'CONTACT US | MANAGE PREFERENCES | UNSUBSCRIBE',
    '© 2026 The Connection Media Group L.L.C. All rights reserved.',
    "You're receiving this email because you signed up for updates from The Connection."
  ].join('\n');

  return { html, text };
}
