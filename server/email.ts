import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Check for AWS credentials
let emailFunctionalityEnabled = false;
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  console.warn("AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) not set. Email functionality will be disabled.");
  console.warn("Users can still register but won't receive welcome emails.");
} else {
  emailFunctionalityEnabled = true;
}

// Initialize the SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: emailFunctionalityEnabled ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  } : undefined
});

interface EmailParams {
  to: string;
  from: string; 
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have sent email to:', params.to);
    console.log('Email subject:', params.subject);
    // Don't log the full email content to avoid cluttering the logs
    return false;
  }
  
  try {
    // Create the email command
    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: [params.to]
      },
      Message: {
        Body: {
          ...(params.html && { 
            Html: {
              Charset: "UTF-8",
              Data: params.html
            }
          }),
          ...(params.text && {
            Text: {
              Charset: "UTF-8",
              Data: params.text
            }
          })
        },
        Subject: {
          Charset: "UTF-8",
          Data: params.subject
        }
      },
      Source: params.from
    });

    // Send the email
    const response = await sesClient.send(sendEmailCommand);
    console.log(`Email sent successfully to ${params.to}`, response.MessageId);
    return true;
  } catch (error) {
    console.error('AWS SES email error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, displayName: string = ""): Promise<boolean> {
  const name = displayName || email.split('@')[0];
  
  return sendEmail({
    to: email,
    from: process.env.AWS_SES_FROM_EMAIL || 'The Connection <noreply@theconnection.app>', // Use environment variable if available
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
            <a href="https://theconnection.app/auth" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            This email was sent to ${email}. If you did not create this account, please disregard this email.
          </p>
        </div>
      </div>
    `
  });
}