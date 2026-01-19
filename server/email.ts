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
    // Fall back to regular email
    return sendEmail({
      to: email,
      from: from,
      subject: 'Welcome to The Connection!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0B132B; padding: 20px; text-align: center;">
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
              <a href="${BASE_URL}/auth" style="background-color: #0B132B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This email was sent to ${email}. If you did not create this account, please disregard this email.
            </p>
          </div>
        </div>
      `
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
  const resetLink = `${APP_URLS.RESET_PASSWORD}?token=${resetToken}&email=${encodeURIComponent(email)}`;

  console.info('[PASSWORD_RESET_EMAIL] Reset link generated:', resetLink);
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
      text: `We received a request to reset your password. If you didn't make this request, you can safely ignore this email.

To reset your password, click the link below:
${resetLink}

This link will expire in 24 hours.

For security reasons, please do not share this link with anyone.

If you did not request a password reset, please contact our support team immediately at support@theconnection.app

© The Connection Media Group 2026. All rights reserved.`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="width:100%;-webkit-text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tbody>
      <tr>
        <td>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#f2eeea">
            <tbody>
              <!-- Header with logo placeholder -->
              <tr>
                <td style="background-color:#1a2a4a;padding:20px;text-align:center;">
                  <h1 style="color:white;margin:0;font-family:Helvetica,Arial,sans-serif;">The Connection</h1>
                </td>
              </tr>
              <!-- Main content -->
              <tr>
                <td style="padding:30px 20px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;color:#1c1c1e;font-size:16px;line-height:1.5;text-align:center;">
                    <tr>
                      <td style="padding-bottom:16px;">
                        We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:16px;">
                        To reset your password, click the button below:
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 0;">
                        <a href="${resetLink}" style="display:inline-block;background-color:#1a2a4a;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0 20px 0;color:#666;font-size:13px;">
                        Or copy this link:<br>
                        <a href="${resetLink}" style="color:#1a2477;word-break:break-all;font-size:12px;">${resetLink}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:16px;">
                        This link will expire in 24 hours.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:16px;font-weight:bold;">
                        For security reasons, please do not share this link with anyone.
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
                        If you did not request a password reset, please contact our support team immediately.
                        <a href="mailto:support@theconnection.app" style="color:#1a2477;text-decoration:none;">support@theconnection.app</a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        © The Connection Media Group 2026. All rights reserved.
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
