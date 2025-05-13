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
  region: 'us-east-2', // Hardcoding the region to ensure it's formatted correctly
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
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have created template:', params.TemplateName);
    return false;
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
    console.log('Email template created:', params.TemplateName);
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
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have updated template:', params.TemplateName);
    return false;
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
    console.log('Email template updated:', params.TemplateName);
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
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have deleted template:', templateName);
    return false;
  }
  
  try {
    const deleteTemplateCommand = new DeleteTemplateCommand({
      TemplateName: templateName
    });
    
    await sesClient.send(deleteTemplateCommand);
    console.log('Email template deleted:', templateName);
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
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have listed templates.');
    return [];
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
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have retrieved template:', templateName);
    return null;
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
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have sent templated email to:', to);
    console.log('Template:', templateName);
    console.log('Template data:', JSON.stringify(templateData));
    return false;
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
    console.log(`Templated email sent successfully to ${to}`, response.MessageId);
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
  LIVESTREAM_INVITE: 'TheConnection_LivestreamInvite'
};

/**
 * Initialize all email templates
 */
export async function initializeEmailTemplates(): Promise<void> {
  if (!emailFunctionalityEnabled) {
    console.log('Email functionality disabled. Would have initialized templates.');
    return;
  }
  
  console.log('Initializing email templates...');
  await setupWelcomeTemplate();
  await setupPasswordResetTemplate();
  await setupNotificationTemplate();
  await setupLivestreamInviteTemplate();
  console.log('Email templates initialized.');
}

// Create or update the welcome template
export async function setupWelcomeTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.WELCOME;
  const subjectPart = 'Welcome to The Connection!';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
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
          <a href="https://theconnection.app/auth" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a>
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
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Password Reset Request</h2>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password for your account at The Connection. To complete this process, please click the button below.</p>
        <p>This link will expire in 24 hours.</p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{resetLink}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
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
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>{{title}}</h2>
        <p>Hello {{name}},</p>
        <p>{{message}}</p>
        
        {{#if actionUrl}}
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{actionUrl}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">{{actionText}}</a>
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
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>You're Invited to a Livestream</h2>
        <p>Hello {{name}},</p>
        <p>{{hostName}} has invited you to join their upcoming livestream:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6d28d9;">{{streamTitle}}</h3>
          <p style="margin-bottom: 5px;"><strong>When:</strong> {{streamDate}} at {{streamTime}}</p>
          <p style="margin-top: 0;"><strong>Description:</strong> {{streamDescription}}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{streamUrl}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Livestream</a>
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
  const from = process.env.AWS_SES_FROM_EMAIL || 'The Connection <noreply@theconnection.app>';
  
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
}

export async function sendPasswordResetEmail(email: string, displayName: string = "", resetToken: string): Promise<boolean> {
  const name = displayName || email.split('@')[0];
  const from = process.env.AWS_SES_FROM_EMAIL || 'The Connection <noreply@theconnection.app>';
  const resetLink = `https://theconnection.app/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.PASSWORD_RESET);
  
  if (template) {
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
    // Fall back to regular email
    return sendEmail({
      to: email,
      from: from,
      subject: 'Reset Your Password - The Connection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">The Connection</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your account at The Connection. To complete this process, please click the button below.</p>
            <p>This link will expire in 24 hours.</p>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${resetLink}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
            </div>
            
            <p style="margin-top: 20px;">If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This email was sent to ${email}. 
            </p>
          </div>
        </div>
      `
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
  const from = process.env.AWS_SES_FROM_EMAIL || 'The Connection <noreply@theconnection.app>';
  
  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.NOTIFICATION);
  
  if (template) {
    // Send using template
    return sendTemplatedEmail(
      params.email,
      from,
      DEFAULT_TEMPLATES.NOTIFICATION,
      {
        name,
        email: params.email,
        subject: params.subject,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl || "",
        actionText: params.actionText || "View Details"
      }
    );
  } else {
    // Fall back to regular email
    let actionButton = '';
    if (params.actionUrl) {
      actionButton = `
        <div style="margin-top: 30px; text-align: center;">
          <a href="${params.actionUrl}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${params.actionText || 'View Details'}</a>
        </div>
      `;
    }
    
    return sendEmail({
      to: params.email,
      from: from,
      subject: params.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
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
  const from = process.env.AWS_SES_FROM_EMAIL || 'The Connection <noreply@theconnection.app>';
  
  // Check if we have templates enabled and available
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.LIVESTREAM_INVITE);
  
  if (template) {
    // Send using template
    return sendTemplatedEmail(
      params.email,
      from,
      DEFAULT_TEMPLATES.LIVESTREAM_INVITE,
      {
        name,
        email: params.email,
        hostName: params.hostName,
        streamTitle: params.streamTitle,
        streamDate: params.streamDate,
        streamTime: params.streamTime,
        streamDescription: params.streamDescription,
        streamUrl: params.streamUrl
      }
    );
  } else {
    // Fall back to regular email
    return sendEmail({
      to: params.email,
      from: from,
      subject: `You're Invited: ${params.streamTitle} - Live on The Connection`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">The Connection</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>You're Invited to a Livestream</h2>
            <p>Hello ${name},</p>
            <p>${params.hostName} has invited you to join their upcoming livestream:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #6d28d9;">${params.streamTitle}</h3>
              <p style="margin-bottom: 5px;"><strong>When:</strong> ${params.streamDate} at ${params.streamTime}</p>
              <p style="margin-top: 0;"><strong>Description:</strong> ${params.streamDescription}</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${params.streamUrl}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Livestream</a>
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