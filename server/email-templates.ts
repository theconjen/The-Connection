import { DEFAULT_TEMPLATES, createEmailTemplate, getEmailTemplate, updateEmailTemplate } from './email';

// Create or update the livestreamer application notification template
export async function setupApplicationNotificationTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.APPLICATION_NOTIFICATION;
  const subjectPart = 'New Livestreamer Application: {{applicantName}}';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>New Livestreamer Application</h2>
        <p>A new application to become a livestreamer has been submitted and requires your review.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6d28d9;">Application Details</h3>
          <p><strong>Applicant:</strong> {{applicantName}}</p>
          <p><strong>Email:</strong> {{applicantEmail}}</p>
          <p><strong>Ministry Name:</strong> {{ministryName}}</p>
          <p><strong>Application ID:</strong> {{applicationId}}</p>
          <p><strong>Submitted On:</strong> {{applicationDate}}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{reviewLink}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Review Application</a>
        </div>
        
        <p style="margin-top: 20px;">Please review this application at your earliest convenience.</p>
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

// Create or update the application status update template
export async function setupApplicationStatusUpdateTemplate(): Promise<boolean> {
  const templateName = DEFAULT_TEMPLATES.APPLICATION_STATUS_UPDATE;
  const subjectPart = 'Your Livestreamer Application Status: {{status}}';
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Livestreamer Application Update</h2>
        <p>Hello {{applicantName}},</p>
        <p>Your application to become a livestreamer for {{ministryName}} has been <strong>{{status}}</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6d28d9;">Review Notes</h3>
          <p>{{reviewNotes}}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{platformLink}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Visit Platform</a>
        </div>
        
        <p style="margin-top: 20px;">Thank you for your interest in contributing to our community.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}.<br>
          You're receiving this email because you submitted a livestreamer application.
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