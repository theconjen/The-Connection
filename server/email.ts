import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string; 
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not set. Would have sent email:', params);
    return false;
  }
  
  try {
    await mailService.send(params);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, displayName: string = ""): Promise<boolean> {
  const name = displayName || email.split('@')[0];
  
  return sendEmail({
    to: email,
    from: 'support@theconnection.replit.app', // Update with your verified domain
    subject: 'Welcome to The Connection!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">The Connection</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining The Connection, a Christian community platform for spiritual growth, apologetics, and Bible study.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>Join communities based on your interests</li>
            <li>Participate in discussions about faith</li>
            <li>Access apologetics resources</li>
            <li>Watch and participate in livestreams</li>
            <li>Form or join private groups for Bible study</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://theconnection.replit.app/auth" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            This email was sent to ${email}. If you did not create this account, please disregard this email.
          </p>
        </div>
      </div>
    `
  });
}