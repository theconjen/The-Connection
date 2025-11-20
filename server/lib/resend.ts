/* Lightweight Resend helper
 * - Reads RESEND_API_KEY from env
 * - Lazily imports the `resend` package to avoid hard failure when not installed
 * - Exports sendViaResend(params) for direct usage
 */
type ResendSendParams = {
  from: string;
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
};

let resendClient: any = null;
const key = process.env.RESEND_API_KEY || '';

function initIfNeeded() {
  if (resendClient || !key) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Resend } = require('resend');
    resendClient = new Resend(key);
  } catch (err) {
    // keep resendClient null if import fails
    resendClient = null;
  }
}

export async function sendViaResend(params: ResendSendParams): Promise<boolean> {
  initIfNeeded();
  if (!resendClient) {
    throw new Error('Resend client not configured. Set RESEND_API_KEY and install the `resend` package.');
  }

  const payload: any = {
    from: params.from,
    to: params.to,
  };
  if (params.subject) payload.subject = params.subject;
  if (params.html) payload.html = params.html;
  if (params.text) payload.text = params.text;

  await resendClient.emails.send(payload);
  return true;
}

export function isResendConfigured(): boolean {
  initIfNeeded();
  return !!resendClient;
}
