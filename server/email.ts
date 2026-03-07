import { 
  SESClient, 
  SendEmailCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  GetTemplateCommand,
  SendTemplatedEmailCommand,
  Template
} from '@aws-sdk/client-ses';
import { APP_DOMAIN, BASE_URL, EMAIL_FROM, APP_URLS } from './config/domain';

// Email functionality configuration
let emailFunctionalityEnabled = false;
let sesAvailable = false;

// Control whether to use real email sending. If ENABLE_REAL_EMAIL is set, respect it;
// otherwise auto-enable when a provider (Resend/SendGrid/AWS) is configured.
const enableRealEmailEnv = process.env.ENABLE_REAL_EMAIL;
const forceMockMode = process.env.FORCE_EMAIL_MOCK_MODE === 'true';

// Optional Resend integration. Install `resend` and set RESEND_API_KEY to enable.
let resendClient: any = null;
let sendGridClient: typeof import('@sendgrid/mail') | null = null;
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESEND__API_KEY || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const hasResend = Boolean(RESEND_API_KEY);
const hasSendGrid = Boolean(SENDGRID_API_KEY);

const hasAwsCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION);
const ENABLE_REAL_EMAIL =
  enableRealEmailEnv === 'true' ||
  (enableRealEmailEnv !== 'false' && (hasResend || hasSendGrid || hasAwsCredentials));

// Startup logging for email configuration
console.info('[EMAIL_STARTUP] Configuration:', {
  forceMockMode,
  ENABLE_REAL_EMAIL,
  hasResend,
  hasSendGrid,
  hasAwsCredentials,
  RESEND_API_KEY_SET: !!RESEND_API_KEY,
  RESEND_API_KEY_LENGTH: RESEND_API_KEY.length,
  EMAIL_FROM
});

if (forceMockMode) {
  console.warn('[EMAIL_STARTUP] FORCE_EMAIL_MOCK_MODE=true - all emails will be mocked');
} else if (!ENABLE_REAL_EMAIL) {
  console.warn('[EMAIL_STARTUP] ENABLE_REAL_EMAIL is false - emails disabled');
} else if (!hasAwsCredentials && !hasResend && !hasSendGrid) {
  console.warn("[EMAIL_STARTUP] ⚠️ No email provider credentials set (AWS, SendGrid, or Resend). Email functionality will be disabled.");
  console.warn("[EMAIL_STARTUP] ⚠️ Users can still register but won't receive actual emails.");
} else {
  emailFunctionalityEnabled = true;
  console.info('[EMAIL_STARTUP] Email functionality ENABLED');
  if (hasAwsCredentials) {
    sesAvailable = true;
    console.info('[EMAIL_STARTUP] AWS SES available');
  }
  if (hasSendGrid) {
    console.info('[EMAIL_STARTUP] SendGrid available');
  }
  if (hasResend) {
    console.info('[EMAIL_STARTUP] Resend available');
  }
}

// Initialize the SES client
// Extract just the first region if multiple are provided
let awsRegion = 'us-east-1'; // Default region
if (process.env.AWS_REGION) {
  // Split by comma and take the first region, removing any whitespace
  const regions = process.env.AWS_REGION.split(',');
  if (regions.length > 0) {
    awsRegion = regions[0].trim();
  }
}

const sesClient = new SESClient({
  region: awsRegion,
  credentials: hasAwsCredentials ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  } : undefined
});

if (RESEND_API_KEY) {
  try {
    // Import lazily to avoid adding a hard runtime dependency when not used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Resend } = require('resend');
    resendClient = new Resend(RESEND_API_KEY);
    console.info('[EMAIL_STARTUP] ✅ Resend client initialized successfully');
  } catch (err) {
    console.error('[EMAIL_STARTUP] ❌ Resend package not available or failed to initialize:', err);
    resendClient = null;
  }
}

if (SENDGRID_API_KEY) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sendGridClient = require('@sendgrid/mail');
  sendGridClient.setApiKey(SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string; 
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  console.info('[EMAIL] sendEmail called:', {
    to: params.to,
    from: params.from,
    subject: params.subject,
    emailFunctionalityEnabled,
    forceMockMode,
    hasResendClient: !!resendClient,
    hasSendGridClient: !!sendGridClient,
    sesAvailable
  });

  if (forceMockMode || !emailFunctionalityEnabled) {
    // Log in ALL environments so we can see this in Render
    console.warn('[EMAIL] MOCK MODE - email NOT actually sent:', {
      to: params.to,
      subject: params.subject,
      reason: forceMockMode ? 'FORCE_EMAIL_MOCK_MODE=true' : 'emailFunctionalityEnabled=false'
    });
    return true; // Return true in mock mode to simulate success
  }

  try {
    // If Resend is configured, prefer using it for simple email sends
    if (resendClient) {
      console.info('[EMAIL] Attempting to send via Resend...');
      try {
        const resendResponse = await resendClient.emails.send({
          from: params.from || EMAIL_FROM,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text
        });
        console.info('[EMAIL] Resend SUCCESS:', resendResponse);
        return true;
      } catch (resendErr: any) {
        console.error('[EMAIL] Resend FAILED:', {
          error: resendErr?.message || resendErr,
          statusCode: resendErr?.statusCode,
          name: resendErr?.name
        });
        // fall through to SES below
      }
    }

    if (sendGridClient) {
      console.info('[EMAIL] Attempting to send via SendGrid...');
      try {
        const sgResponse = await sendGridClient.send({
          to: params.to,
          from: params.from || EMAIL_FROM,
          subject: params.subject,
          html: params.html,
          text: params.text
        });
        console.info('[EMAIL] SendGrid SUCCESS:', sgResponse);
        return true;
      } catch (sendGridErr: any) {
        console.error('[EMAIL] SendGrid FAILED:', sendGridErr?.message || sendGridErr);
      }
    }

    if (!sesAvailable) {
      console.error('[EMAIL] ALL PROVIDERS FAILED - no SES fallback available');
      return false;
    }

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
    return true;
  } catch (error) {
    console.error('AWS SES email error:', error);
    
    // Log email details for debugging but protect sensitive information
    
    // In development mode, we can simulate success if needed
    if (process.env.NODE_ENV !== 'production' && process.env.MOCK_EMAIL_SUCCESS === 'true') {
      return true;
    }
    
    return false;
  }
}

/**
 * Template management functions
 */

export interface EmailTemplateParams {
  TemplateName: string;
  SubjectPart: string;
  TextPart?: string;
  HtmlPart?: string;
}

/**
 * Creates a new email template in AWS SES
 */
export async function createEmailTemplate(params: EmailTemplateParams): Promise<boolean> {
  if (forceMockMode || !emailFunctionalityEnabled || !sesAvailable) {
    return true; // Return true in mock mode to simulate success
  }
  
  try {
    const createTemplateCommand = new CreateTemplateCommand({
      Template: {
        TemplateName: params.TemplateName,
        SubjectPart: params.SubjectPart,
        TextPart: params.TextPart,
        HtmlPart: params.HtmlPart
      }
    });
    
    await sesClient.send(createTemplateCommand);
    return true;
  } catch (error) {
    console.error('Error creating email template:', error);
    return false;
  }
}

/**
 * Updates an existing email template in AWS SES
 */
export async function updateEmailTemplate(params: EmailTemplateParams): Promise<boolean> {
  if (forceMockMode || !emailFunctionalityEnabled || !sesAvailable) {
    return true; // Return true in mock mode to simulate success
  }
  
  try {
    const updateTemplateCommand = new UpdateTemplateCommand({
      Template: {
        TemplateName: params.TemplateName,
        SubjectPart: params.SubjectPart,
        TextPart: params.TextPart,
        HtmlPart: params.HtmlPart
      }
    });
    
    await sesClient.send(updateTemplateCommand);
    return true;
  } catch (error) {
    console.error('Error updating email template:', error);
    return false;
  }
}

/**
 * Deletes an email template from AWS SES
 */
export async function deleteEmailTemplate(templateName: string): Promise<boolean> {
  if (forceMockMode || !emailFunctionalityEnabled || !sesAvailable) {
    return true; // Return true in mock mode to simulate success
  }
  
  try {
    const deleteTemplateCommand = new DeleteTemplateCommand({
      TemplateName: templateName
    });
    
    await sesClient.send(deleteTemplateCommand);
    return true;
  } catch (error) {
    console.error('Error deleting email template:', error);
    return false;
  }
}

/**
 * Gets a list of all email templates in AWS SES
 */
export async function listEmailTemplates(): Promise<string[]> {
  if (forceMockMode || !emailFunctionalityEnabled || !sesAvailable) {
    // Return some mock template names to simulate the API
    return Object.values(DEFAULT_TEMPLATES);
  }
  
  try {
    const listTemplatesCommand = new ListTemplatesCommand({});
    const response = await sesClient.send(listTemplatesCommand);
    
    return (response.TemplatesMetadata || []).map(template => template.Name || '');
  } catch (error) {
    console.error('Error listing email templates:', error);
    return [];
  }
}

/**
 * Gets details of a specific email template from AWS SES
 */
export async function getEmailTemplate(templateName: string): Promise<Template | null> {
  // Only return a template if SES is actually available
  // Otherwise return null to fall back to inline email (which uses Resend/SendGrid)
  if (!sesAvailable) {
    console.info('[EMAIL] getEmailTemplate: SES not available, returning null to use inline email with Resend/SendGrid');
    return null;
  }

  if (forceMockMode || !emailFunctionalityEnabled) {
    // Return a mock template in mock mode (only when SES would be available)
    return {
      TemplateName: templateName,
      SubjectPart: `Mock subject for ${templateName}`,
      TextPart: `Mock text content for ${templateName}`,
      HtmlPart: `<div>Mock HTML content for ${templateName}</div>`
    };
  }
  
  try {
    const getTemplateCommand = new GetTemplateCommand({
      TemplateName: templateName
    });
    
    const response = await sesClient.send(getTemplateCommand);
    return response.Template || null;
  } catch (error) {
    console.error('Error getting email template:', error);
    return null;
  }
}

/**
 * Sends an email using a template with template data
 */
export async function sendTemplatedEmail(params: {
  to: string,
  from: string,
  templateName: string,
  templateData: Record<string, any>
}): Promise<boolean> {
  const { to, from, templateName, templateData } = params;
  if (forceMockMode || !emailFunctionalityEnabled || !sesAvailable) {
    return true; // Return true in mock mode to simulate success
  }
  
  try {
    const sendTemplatedEmailCommand = new SendTemplatedEmailCommand({
      Destination: {
        ToAddresses: [to]
      },
      Source: from,
      Template: templateName,
      TemplateData: JSON.stringify(templateData)
    });
    
    const response = await sesClient.send(sendTemplatedEmailCommand);
    return true;
  } catch (error) {
    console.error('Error sending templated email:', error);
    return false;
  }
}

// Define our default templates
export const DEFAULT_TEMPLATES = {
  WELCOME: 'TheConnection_Welcome',
  PASSWORD_RESET: 'TheConnection_PasswordReset',
  NOTIFICATION: 'TheConnection_Notification',
  LIVESTREAM_INVITE: 'TheConnection_LivestreamInvite',
  APPLICATION_NOTIFICATION: 'TheConnection_LivestreamerApplicationNotification',
  APPLICATION_STATUS_UPDATE: 'TheConnection_ApplicationStatusUpdate',
  COMMUNITY_INVITATION: 'TheConnection_CommunityInvitation'
};

/**
 * Initialize all email templates
 */
export async function initializeEmailTemplates(): Promise<void> {

  if (forceMockMode) {
    return;
  }
  
  if (!emailFunctionalityEnabled || !sesAvailable) {
    return;
  }

  try {
    // Test AWS credentials with a simple list templates call
    try {
      const listResult = await listEmailTemplates();
    } catch (error) {
      console.error('Error testing AWS SES credentials:', error);
      return;
    }
    
    // Welcome template
    await setupWelcomeTemplate();
    
    // Password reset template
    await setupPasswordResetTemplate();
    
    // Notification template
    await setupNotificationTemplate();
    
    // Livestream invite template
    await setupLivestreamInviteTemplate();
    
    // Application notification templates
    const { setupApplicationNotificationTemplate, setupApplicationStatusUpdateTemplate } = await import('./email-templates');
    await setupApplicationNotificationTemplate();
    
    await setupApplicationStatusUpdateTemplate();
    
    // Community invitation template
    await setupCommunityInvitationTemplate();
    
  } catch (error) {
    console.error('Error initializing email templates:', error);
  }
}

// Create or update the welcome template
export async function setupWelcomeTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.WELCOME;
  const subjectPart = 'Welcome to The Connection!';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B132B; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Welcome, {{name}}!</h2>
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
          <a href="${BASE_URL}/auth" style="background-color: #0B132B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}. If you did not create this account, please disregard this email.
        </p>
      </div>
    </div>
  `;
  
  try {
    // Check if template exists first
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error('Error setting up welcome template:', error);
    return false;
  }
}

// Create or update the password reset template
export async function setupPasswordResetTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.PASSWORD_RESET;
  const subjectPart = 'Reset Your Password - The Connection';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B132B; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Password Reset Request</h2>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password for your account at The Connection. To complete this process, please click the button below.</p>
        <p>This link will expire in 24 hours.</p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{resetLink}}" style="background-color: #0B132B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </div>
        
        <p style="margin-top: 20px;">If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}. 
        </p>
      </div>
    </div>
  `;
  
  try {
    // Check if template exists first
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error('Error setting up password reset template:', error);
    return false;
  }
}

// Create or update the notification template
export async function setupNotificationTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.NOTIFICATION;
  const subjectPart = '{{subject}}';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B132B; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>{{title}}</h2>
        <p>Hello {{name}},</p>
        <p>{{message}}</p>
        
        {{#if actionUrl}}
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{actionUrl}}" style="background-color: #0B132B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">{{actionText}}</a>
        </div>
        {{/if}}
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}.<br>
          You're receiving this email because you have an account on The Connection.
        </p>
      </div>
    </div>
  `;
  
  try {
    // Check if template exists first
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error('Error setting up notification template:', error);
    return false;
  }
}

// Create or update the livestream invitation template
export async function setupLivestreamInviteTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.LIVESTREAM_INVITE;
  const subjectPart = 'You\'re Invited: {{streamTitle}} - Live on The Connection';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B132B; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>You're Invited to a Livestream</h2>
        <p>Hello {{name}},</p>
        <p>{{hostName}} has invited you to join their upcoming livestream:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0B132B;">{{streamTitle}}</h3>
          <p style="margin-bottom: 5px;"><strong>When:</strong> {{streamDate}} at {{streamTime}}</p>
          <p style="margin-top: 0;"><strong>Description:</strong> {{streamDescription}}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{streamUrl}}" style="background-color: #0B132B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Livestream</a>
        </div>
        
        <p style="margin-top: 20px;">Don't miss out on this opportunity to connect and grow in your faith journey!</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}.<br>
          You're receiving this invitation because you're a member of The Connection community.
        </p>
      </div>
    </div>
  `;
  
  try {
    // Check if template exists first
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error('Error setting up livestream invite template:', error);
    return false;
  }
}

/**
 * Helper functions for sending emails with templates
 */

export async function sendWelcomeEmail(email: string, displayName: string = ""): Promise<boolean> {
  const name = displayName || email.split('@')[0];
  const from = EMAIL_FROM;
  
  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.WELCOME);
  
  if (template) {
    // Send using template
    return sendTemplatedEmail({
      to: email,
      from,
      templateName: DEFAULT_TEMPLATES.WELCOME,
      templateData: {
        name,
        email
      }
    });
  } else {
    // Fall back to branded email template
    return sendEmail({
      to: email,
      from: from,
      subject: 'Welcome to The Connection!',
      text: [
        'The Connection',
        '',
        `Welcome, ${name}!`,
        '',
        'Thank you for joining The Connection. Here is what you can do:',
        '- Join communities based on your interests',
        '- Participate in discussions about faith',
        '- Access apologetics resources',
        '- Attend events and connect with others',
        '- Form or join groups for Bible study',
        '',
        'support@theconnection.app',
        '(c) 2026 The Connection Media Group L.L.C.',
      ].join('\n'),
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
</head>
<body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tbody>
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tbody>
              <tr>
                <td style="background-color:#1a2a4a;padding:32px 24px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:26px;font-weight:400;letter-spacing:0.5px;">The Connection</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px 32px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1c1e;font-size:16px;line-height:1.6;">
                    <tr>
                      <td style="text-align:center;padding-bottom:8px;">
                        <h2 style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:28px;font-weight:400;color:#1a2a4a;">Welcome, ${name}!</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align:center;padding-bottom:32px;color:#6b7280;font-size:15px;">
                        Thank you for joining The Connection. Your community is ready.
                      </td>
                    </tr>
                    <!-- Feature list -->
                    <tr>
                      <td style="padding-bottom:32px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:12px 16px;background-color:#f8f7f5;border-radius:8px 8px 0 0;border-bottom:1px solid #e5e7eb;">
                              <span style="color:#1a2a4a;font-size:15px;">Join communities based on your interests</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:12px 16px;background-color:#f8f7f5;border-bottom:1px solid #e5e7eb;">
                              <span style="color:#1a2a4a;font-size:15px;">Participate in discussions about faith</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:12px 16px;background-color:#f8f7f5;border-bottom:1px solid #e5e7eb;">
                              <span style="color:#1a2a4a;font-size:15px;">Access apologetics resources</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:12px 16px;background-color:#f8f7f5;border-bottom:1px solid #e5e7eb;">
                              <span style="color:#1a2a4a;font-size:15px;">Attend events and connect with others</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:12px 16px;background-color:#f8f7f5;border-radius:0 0 8px 8px;">
                              <span style="color:#1a2a4a;font-size:15px;">Form or join groups for Bible study</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- CTA -->
                    <tr>
                      <td style="text-align:center;padding-bottom:32px;">
                        <a href="theconnection://home" style="display:inline-block;background-color:#1a2a4a;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;letter-spacing:0.3px;">Open The Connection</a>
                      </td>
                    </tr>
                    <!-- Mission -->
                    <tr>
                      <td style="padding:0;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8f7f5;border-radius:8px;">
                          <tr>
                            <td style="padding:24px;text-align:center;">
                              <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;padding-bottom:8px;">Our Mission</div>
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
              <tr>
                <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
                    <tr><td style="padding-bottom:8px;"><a href="mailto:support@theconnection.app" style="color:#1a2a4a;text-decoration:none;">support@theconnection.app</a></td></tr>
                    <tr><td>&copy; 2026 The Connection Media Group L.L.C.</td></tr>
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
</html>`
    });
  }
}

export async function sendPasswordResetEmail(email: string, displayName: string = "", resetToken: string): Promise<boolean> {
  console.info('[PASSWORD_RESET_EMAIL] Starting sendPasswordResetEmail:', {
    email,
    displayName,
    tokenLength: resetToken?.length
  });

  const name = displayName || email.split('@')[0];
  const from = EMAIL_FROM;

  // Primary: Universal Link - works in all email clients AND opens app if installed
  // This is the main link used in buttons (custom schemes are blocked by most email apps)
  const resetLink = `${APP_URLS.RESET_PASSWORD}?token=${resetToken}&email=${encodeURIComponent(email)}`;
  // Alias for backwards compatibility
  const webFallbackLink = resetLink;
  // Custom scheme (only used in plain text fallback - many email clients block these)
  const appDeepLink = `theconnection://reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  console.info('[PASSWORD_RESET_EMAIL] Primary reset link (Universal Link):', resetLink);
  console.info('[PASSWORD_RESET_EMAIL] Custom scheme fallback:', appDeepLink);
  console.info('[PASSWORD_RESET_EMAIL] From address:', from);

  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.PASSWORD_RESET);

  if (template) {
    console.info('[PASSWORD_RESET_EMAIL] Using templated email');
    // Send using template
    return sendTemplatedEmail({
      to: email,
      from,
      templateName: DEFAULT_TEMPLATES.PASSWORD_RESET,
      templateData: {
        name,
        email,
        resetLink
      }
    });
  } else {
    console.info('[PASSWORD_RESET_EMAIL] Using inline HTML email (no template)');
    // Fall back to branded email template
    return sendEmail({
      to: email,
      from: from,
      subject: 'Reset Your Password - The Connection',
      text: [
        'The Connection',
        '',
        'Reset Your Password',
        '',
        `Hi ${name},`,
        '',
        'We received a request to reset your password. Tap the link below to choose a new one.',
        '',
        resetLink,
        '',
        'This link expires in 1 hour.',
        '',
        "If you didn't request this, you can safely ignore this email. Your password won't change.",
        '',
        'support@theconnection.app',
        '(c) 2026 The Connection Media Group L.L.C.',
      ].join('\n'),
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                        <h2 style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:28px;font-weight:400;color:#1a2a4a;line-height:1.3;">Reset Your Password</h2>
                      </td>
                    </tr>
                    <!-- Greeting -->
                    <tr>
                      <td style="text-align:center;padding-bottom:32px;color:#6b7280;font-size:15px;">
                        Hi ${name}, we received a request to reset your password. Tap below to choose a new one.
                      </td>
                    </tr>
                    <!-- CTA Button -->
                    <tr>
                      <td style="text-align:center;padding-bottom:32px;">
                        <a href="${resetLink}" style="display:inline-block;background-color:#1a2a4a;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;letter-spacing:0.3px;">Reset Password</a>
                      </td>
                    </tr>
                    <!-- Expiry notice -->
                    <tr>
                      <td style="text-align:center;padding-bottom:24px;color:#9ca3af;font-size:13px;">
                        This link expires in 1 hour.
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
                        <a href="${resetLink}" style="color:#1a2a4a;word-break:break-all;font-size:12px;">${resetLink}</a>
                      </td>
                    </tr>
                    <!-- Security note -->
                    <tr>
                      <td style="padding:0;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8f7f5;border-radius:8px;">
                          <tr>
                            <td style="padding:20px 24px;text-align:center;color:#6b7280;font-size:13px;line-height:1.5;">
                              If you didn't request this, you can safely ignore this email. Your password won't change.
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
</html>`
    });
  }
}

export interface NotificationEmailParams {
  email: string;
  name?: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export async function sendNotificationEmail(params: NotificationEmailParams): Promise<boolean> {
  const name = params.name || params.email.split('@')[0];
  const from = EMAIL_FROM;
  
  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.NOTIFICATION);
  
  if (template) {
    // Send using template
    return sendTemplatedEmail({
      to: params.email,
      from,
      templateName: DEFAULT_TEMPLATES.NOTIFICATION,
      templateData: {
        name,
        email: params.email,
        subject: params.subject,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl || "",
        actionText: params.actionText || "View Details"
      }
    });
  } else {
    // Fall back to regular email
    let actionButton = '';
    if (params.actionUrl) {
      actionButton = `
        <div style="margin-top: 30px; text-align: center;">
          <a href="${params.actionUrl}" style="background-color: #0B132B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${params.actionText || 'View Details'}</a>
        </div>
      `;
    }
    
    return sendEmail({
      to: params.email,
      from: from,
      subject: params.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0B132B; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">The Connection</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>${params.title}</h2>
            <p>Hello ${name},</p>
            <p>${params.message}</p>
            
            ${actionButton}
            
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This email was sent to ${params.email}.<br>
              You're receiving this email because you have an account on The Connection.
            </p>
          </div>
        </div>
      `
    });
  }
}

export interface LivestreamInviteEmailParams {
  email: string;
  recipientName?: string;
  hostName: string;
  streamTitle: string;
  streamDate: string;
  streamTime: string;
  streamDescription: string;
  streamUrl: string;
}

export async function sendLivestreamInviteEmail(params: LivestreamInviteEmailParams): Promise<boolean> {
  const name = params.recipientName || params.email.split('@')[0];
  const from = EMAIL_FROM;
  
  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.LIVESTREAM_INVITE);
  
  if (template) {
    // Send using template
    return sendTemplatedEmail({
      to: params.email,
      from,
      templateName: DEFAULT_TEMPLATES.LIVESTREAM_INVITE,
      templateData: {
        name,
        email: params.email,
        hostName: params.hostName,
        streamTitle: params.streamTitle,
        streamDate: params.streamDate,
        streamTime: params.streamTime,
        streamDescription: params.streamDescription,
        streamUrl: params.streamUrl
      }
    });
  } else {
    // Fall back to regular email
    return sendEmail({
      to: params.email,
      from: from,
      subject: `You're Invited: ${params.streamTitle} - Live on The Connection`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0B132B; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">The Connection</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>You're Invited to a Livestream</h2>
            <p>Hello ${name},</p>
            <p>${params.hostName} has invited you to join their upcoming livestream:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0B132B;">${params.streamTitle}</h3>
              <p style="margin-bottom: 5px;"><strong>When:</strong> ${params.streamDate} at ${params.streamTime}</p>
              <p style="margin-top: 0;"><strong>Description:</strong> ${params.streamDescription}</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${params.streamUrl}" style="background-color: #0B132B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Livestream</a>
            </div>
            
            <p style="margin-top: 20px;">Don't miss out on this opportunity to connect and grow in your faith journey!</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This email was sent to ${params.email}.<br>
              You're receiving this invitation because you're a member of The Connection community.
            </p>
          </div>
        </div>
      `
    });
  }
}

// Create or update the community invitation template
export async function setupCommunityInvitationTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.COMMUNITY_INVITATION;
  const subjectPart = 'You\'re invited to join "{{communityName}}" - The Connection';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B132B; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>You've Been Invited!</h2>
        <p>Hello {{recipientName}},</p>
        <p>{{inviterName}} has invited you to join the private community <strong>"{{communityName}}"</strong> on The Connection.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0B132B;">{{communityName}}</h3>
          <p style="margin: 5px 0;"><strong>Description:</strong> {{communityDescription}}</p>
          <p style="margin: 5px 0;"><strong>Invited by:</strong> {{inviterName}}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>Invitation expires:</strong> {{expirationDate}}</p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{invitationUrl}}" style="background-color: #0B132B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Community</a>
        </div>
        
        <p style="margin-top: 20px;">This is a private community, so you'll need to use this special invitation link to join. Click the button above to accept the invitation and become a member.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This invitation was sent to {{email}} by {{inviterName}}.<br>
          If you don't want to join this community, you can safely ignore this email.<br>
          This invitation will expire on {{expirationDate}}.
        </p>
      </div>
    </div>
  `;
  
  try {
    // Check if template exists first
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error(`Error setting up ${templateName}:`, error);
    return false;
  }
}

export interface CommunityInvitationEmailParams {
  email: string;
  recipientName?: string;
  inviterName: string;
  communityName: string;
  communityDescription: string;
  invitationUrl: string;
  expirationDate: string;
}

export async function sendCommunityInvitationEmail(params: CommunityInvitationEmailParams, name: string, p0: string, token: string): Promise<boolean> {
  const recipientName = params.recipientName || params.email.split('@')[0];
  const from = EMAIL_FROM;
  
  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.COMMUNITY_INVITATION);
  
  if (template) {
    // Send using template
    return sendTemplatedEmail({
      to: params.email,
      from,
      templateName: DEFAULT_TEMPLATES.COMMUNITY_INVITATION,
      templateData: {
        recipientName,
        email: params.email,
        inviterName: params.inviterName,
        communityName: params.communityName,
        communityDescription: params.communityDescription,
        invitationUrl: params.invitationUrl,
        expirationDate: params.expirationDate
      }
    });
  } else {
    // Fall back to regular email
    return sendEmail({
      to: params.email,
      from: from,
      subject: `You're invited to join "${params.communityName}" - The Connection`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0B132B; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">The Connection</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>You've Been Invited!</h2>
            <p>Hello ${recipientName},</p>
            <p>${params.inviterName} has invited you to join the private community <strong>"${params.communityName}"</strong> on The Connection.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0B132B;">${params.communityName}</h3>
              <p style="margin: 5px 0;"><strong>Description:</strong> ${params.communityDescription}</p>
              <p style="margin: 5px 0;"><strong>Invited by:</strong> ${params.inviterName}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>Invitation expires:</strong> ${params.expirationDate}</p>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${params.invitationUrl}" style="background-color: #0B132B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Community</a>
            </div>
            
            <p style="margin-top: 20px;">This is a private community, so you'll need to use this special invitation link to join. Click the button above to accept the invitation and become a member.</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This invitation was sent to ${params.email} by ${params.inviterName}.<br>
              If you don't want to join this community, you can safely ignore this email.<br>
              This invitation will expire on ${params.expirationDate}.
            </p>
          </div>
        </div>
      `
    });
  }
}
