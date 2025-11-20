#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../email';

// Load local env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const to = process.env.TEST_EMAIL_TO || 'theconnectionwithjenpodcast@gmail.com';
  const from = process.env.TEST_EMAIL_FROM || process.env.EMAIL_FROM || 'no-reply@theconnection.app';
  const subject = process.env.TEST_EMAIL_SUBJECT || 'Test email from The Connection';
  const html = process.env.TEST_EMAIL_HTML || '<p>This is a test email from <strong>The Connection</strong>.</p>';

  console.log('Using RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
  try {
    const ok = await sendEmail({ to, from, subject, html });
    console.log('sendEmail returned:', ok);
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('sendEmail failed:', err);
    process.exit(1);
  }
}

main();
