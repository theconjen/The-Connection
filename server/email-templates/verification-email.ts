/**
 * Generate verification email HTML using The Connection template
 */
export function generateVerificationEmail(verificationLink: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <style type="text/css">
    @media only screen and (max-width: 450px) {
      .layout-2 { display: none !important; }
      .layout-2-under-450 { display: table !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f4">
    <tr>
      <td align="center" style="padding:40px 20px">
        <!-- Main Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:8px;overflow:hidden">
          <!-- Header with gradient background -->
          <tr>
            <td align="center" style="padding:0">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:60px 40px">
                    <h1 style="color:#ffffff;font-size:48px;font-weight:700;margin:0;font-family:Arial, Helvetica, sans-serif;line-height:1.2">
                      Welcome to<br>The Connection
                    </h1>
                    <p style="color:#ffffff;font-size:18px;margin:20px 0 0 0;font-family:Arial, Helvetica, sans-serif">
                      Be the church and in the word
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color:#070300;font-size:24px;font-weight:700;padding-bottom:20px;font-family:Arial, Helvetica, sans-serif">
                    Your account is ready
                  </td>
                </tr>
                <tr>
                  <td style="color:#4a5568;font-size:16px;line-height:1.6;padding-bottom:30px;font-family:Arial, Helvetica, sans-serif">
                    <p style="margin:0 0 15px 0">Find Believers through our communities</p>
                    <p style="margin:0 0 15px 0">Dive deeper into the Word by using our apologetics center</p>
                    <p style="margin:0">Be bold in Christ through fellowship</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 0">
                    <a href="${verificationLink}" style="display:inline-block;background-color:#667eea;color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:18px;font-weight:700;font-family:Arial, Helvetica, sans-serif">
                      Verify Email & Login
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="color:#718096;font-size:14px;padding-top:20px;font-family:Arial, Helvetica, sans-serif;text-align:center">
                    Or copy and paste this link into your browser:
                  </td>
                </tr>
                <tr>
                  <td style="color:#4299e1;font-size:12px;padding-top:10px;font-family:Arial, Helvetica, sans-serif;word-break:break-all;text-align:center">
                    ${verificationLink}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#070300;padding:40px;text-align:center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color:#f6f5f1;font-size:24px;font-weight:700;padding-bottom:16px;font-family:Arial, Helvetica, sans-serif">
                    Need help?
                  </td>
                </tr>
                <tr>
                  <td style="color:#f6f5f1;font-size:16px;line-height:1.5;font-family:Arial, Helvetica, sans-serif">
                    Email us at <a href="mailto:hello@theconnection.app" style="color:#f6f5f1;font-weight:700;text-decoration:none">hello@theconnection.app</a>,<br>
                    or visit our <span style="font-weight:700">Support Center</span> anytime.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:30px;color:#bfc3c8;font-size:13px;font-family:Arial, Helvetica, sans-serif">
                    No longer want to receive these emails? <a href="#" style="color:#bfc3c8;text-decoration:underline">Unsubscribe</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to The Connection!

Your account is ready. Please verify your email address by clicking the link below:

${verificationLink}

Find Believers through our communities
Dive deeper into the Word by using our apologetics center
Be bold in Christ through fellowship

Need help?
Email us at hello@theconnection.app or visit our Support Center anytime.

This link will expire in 24 hours.
  `;

  return { html, text };
}
