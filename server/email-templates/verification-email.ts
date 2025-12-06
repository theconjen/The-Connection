const LOGO_DATA_URL =
  'data:image/png;base64,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';

/**
 * Generate verification email HTML using the provided branded template.
 * The CTA points to the verification link (one-click, no code entry).
 */
export function generateVerificationEmail(verificationLink: string): { html: string; text: string } {
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preload" as="image" href="${LOGO_DATA_URL}">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <style>
    @media (max-width: 450px) { .layout-0 { display: none !important; } .layout-0-under-450 { display: table !important; } }
    @media (max-width: 450px) { .layout-2 { display: none !important; } .layout-2-under-450 { display: table !important; } }
    @media (max-width: 450px) { .layout-3 { display: none !important; } .layout-3-under-450 { display: table !important; } }
    @media (max-width: 450px) { .layout-4 { display: none !important; } .layout-4-under-450 { display: table !important; } }
  </style>
</head>
<body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5">
    <tr><td style="background-color:#f0f1f5">
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#faf6f1">
        <tr><td style="padding:0 0 10px 0">
          <table border="0" cellpadding="0" cellspacing="0" class="layout-0" align="center" style="display:table;width:100%;background:linear-gradient(90deg, #000000,#3533cd)">
            <tr><td style="text-align:center;padding:16px 20px">
              <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto">
                <tr><td style="text-align:center;color:#ffffff;font-size:20px;font-family:'Times New Roman', Times, serif">The Connection</td></tr>
              </table>
            </td></tr>
          </table>
          <table border="0" cellpadding="0" cellspacing="0" class="layout-0-under-450" align="center" style="display:none;width:100%;background:linear-gradient(90deg, #000000,#3533cd)">
            <tr><td style="text-align:center;padding:16px 20px">
              <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:450px;margin:0 auto">
                <tr><td style="text-align:center;color:#ffffff;font-size:20px;font-family:'Times New Roman', Times, serif">The Connection</td></tr>
              </table>
            </td></tr>
          </table>

          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="padding:10px 0">
              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family:Arial, Helvetica, sans-serif">
                <tr><td style="padding:0 20px">
                  <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                    <tr><td align="center">
                      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:277px">
                        <tr><td style="width:100%;padding:20px 0">
                          <img src="${LOGO_DATA_URL}" width="277" height="278" alt="The Connection logo" style="display:block;width:100%;height:auto;max-width:100%">
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>

                <tr><td style="font-size:48px;font-family:'Times New Roman', Times, serif;text-align:center;padding:0 20px;color:#070300">
                  Your Community is waiting for you...
                </td></tr>

                <tr><td style="padding:16px 20px 0 20px">
                  <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                    <tr><td align="center">
                      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:240px">
                        <tr><td style="width:100%;padding:20px 0">
                          <a href="${verificationLink}" target="_blank" rel="noopener" style="display:table;width:100%;text-decoration:none;padding:12px 16px;background:linear-gradient(90deg, #000000,#3533cd);border-radius:28px;text-align:center">
                            <span style="color:#ffffff;font-size:18px;font-weight:bold;font-family:Arial, Helvetica, sans-serif">Verify Email & Login</span>
                          </a>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>

                <tr><td style="color:#070300;font-size:12px;font-family:'Times New Roman', Times, serif;text-align:center;padding:0 20px">
                  If you did not request this link, please disregard and contact us if you suspect fraud.
                </td></tr>

                <tr><td style="padding:16px 20px">
                  <table border="0" cellpadding="0" cellspacing="0" class="layout-2" align="center" style="display:table;width:100%;max-width:560px;margin:0 auto">
                    <tr><td style="border-radius:10px">
                      <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
                        <tr><td style="font-size:24px;font-family:'Times New Roman', Times, serif;text-align:center;color:#ffffff;padding:40px;background:linear-gradient(90deg, #000000,#3533cd);border-radius:10px 10px 0 0">
                          What’s our mission?
                        </td></tr>
                        <tr><td style="color:#ffffff;font-size:17px;font-family:'Times New Roman', Times, serif;text-align:center;padding:0 40px 32px 40px;background:linear-gradient(90deg, #000000,#3533cd)">
                          A world where believers live with clarity, conviction, and courage because they are connected to the truth and connected to each other.
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>

                  <table border="0" cellpadding="0" cellspacing="0" class="layout-2-under-450" align="center" style="display:none;width:100%;max-width:450px;margin:0 auto">
                    <tr><td style="border-radius:10px">
                      <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
                        <tr><td style="font-size:24px;font-family:'Times New Roman', Times, serif;text-align:center;color:#ffffff;padding:40px;background:linear-gradient(90deg, #000000,#3533cd);border-radius:10px 10px 0 0">
                          What’s our mission?
                        </td></tr>
                        <tr><td style="color:#ffffff;font-size:17px;font-family:'Times New Roman', Times, serif;text-align:center;padding:0 40px 32px 40px;background:linear-gradient(90deg, #000000,#3533cd)">
                          A world where believers live with clarity, conviction, and courage because they are connected to the truth and connected to each other.
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>

                <tr><td style="padding:16px 20px 0 20px">
                  <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto">
                    <tr><td style="height:1px;border-radius:999px;background-color:#000000">&nbsp;</td></tr>
                  </table>
                </td></tr>

                <tr><td style="padding:16px 20px 0 20px;font-size:16px;line-height:1.4;text-align:center;font-family:Arial, Helvetica, sans-serif">
                  Need more support? <br><br>
                  Send us an email at <strong><a href="mailto:support@theconnection.app" style="color:#000000;text-decoration:none">support@theconnection.app</a></strong><br>
                  Or visit us in app on our <strong>Support Center</strong>.
                </td></tr>

                <tr><td style="padding:16px 20px 0 20px">
                  <table border="0" cellpadding="0" cellspacing="0" class="layout-3" align="center" style="display:table;width:100%;max-width:560px;margin:0 auto">
                    <tr><td style="padding:17px">
                      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family:Arial, Helvetica, sans-serif">
                        <tr><td style="font-size:12px;letter-spacing:0.105em;line-height:2.36;text-align:center">
                          <span style="text-decoration:underline;">CONTACT US</span>  |  
                          <span style="text-decoration:underline;">MANAGE PREFERENCES</span>  |  
                          <span style="text-decoration:underline;">UNSUBSCRIBE</span>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                  <table border="0" cellpadding="0" cellspacing="0" class="layout-3-under-450" align="center" style="display:none;width:100%;max-width:450px;margin:0 auto">
                    <tr><td style="padding:17px">
                      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family:Arial, Helvetica, sans-serif">
                        <tr><td style="font-size:12px;letter-spacing:0.105em;line-height:2.36;text-align:center">
                          <span style="text-decoration:underline;">CONTACT US</span>  |  
                          <span style="text-decoration:underline;">MANAGE PREFERENCES</span>  |  
                          <span style="text-decoration:underline;">UNSUBSCRIBE</span>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>

                <tr><td style="padding:16px 20px 0 20px">
                  <table border="0" cellpadding="0" cellspacing="0" class="layout-4" align="center" style="display:table;width:100%;max-width:526px;margin:0 auto">
                    <tr><td style="text-align:center;padding:13px">
                      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family:Arial, Helvetica, sans-serif">
                        <tr><td style="font-size:12px;line-height:1.4;text-align:center">
                          © 2025 The Connection Media Group L.L.C. All rights reserved.<br>
                          You’re receiving this email because you signed up for updates from The Connection.
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                  <table border="0" cellpadding="0" cellspacing="0" class="layout-4-under-450" align="center" style="display:none;width:100%;max-width:424px;margin:0 auto">
                    <tr><td style="text-align:center;padding:13px">
                      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family:Arial, Helvetica, sans-serif">
                        <tr><td style="font-size:12px;line-height:1.4;text-align:center">
                          © 2025 The Connection Media Group L.L.C. All rights reserved.<br>
                          You’re receiving this email because you signed up for updates from The Connection.
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    'The Connection',
    '',
    'Your Community is waiting for you...',
    verificationLink,
    '',
    "If you did not request this link, please disregard and contact us if you suspect fraud.",
    '',
    "What’s our mission?",
    "A world where believers live with clarity, conviction, and courage because they are connected to the truth and connected to each other.",
    '',
    'Need more support?',
    'Send us an email at support@theconnection.app or visit us in app on our Support Center.',
    '',
    'CONTACT US | MANAGE PREFERENCES | UNSUBSCRIBE',
    '© 2025 The Connection Media Group L.L.C. All rights reserved.',
    'You’re receiving this email because you signed up for updates from The Connection.'
  ].join('\n');

  return { html, text };
}
