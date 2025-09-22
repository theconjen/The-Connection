import { DEFAULT_TEMPLATES, sendTemplatedEmail } from './email';
import { APP_DOMAIN } from './config/domain';
import { format } from 'date-fns';

/**
 * Parameters for livestreamer application notification emails
 */
export interface LivestreamerApplicationNotificationParams {
  email: string;
  applicantName: string;
  applicantEmail: string;
  ministryName: string;
  applicationId: number;
  applicationDate: string;
  reviewLink: string;
}

/**
 * Send notification email to admin about a new livestreamer application
 */
export async function sendLivestreamerApplicationNotificationEmail(params: LivestreamerApplicationNotificationParams, fullName: any, id: number): Promise<boolean> {
  try {
    const templateData = {
      applicantName: params.applicantName,
      applicantEmail: params.applicantEmail,
      ministryName: params.ministryName || "Not specified",
      applicationId: params.applicationId.toString(),
      applicationDate: params.applicationDate,
      reviewLink: params.reviewLink
    };

    return await sendTemplatedEmail({
      to: params.email,
      from: `no-reply@${APP_DOMAIN}`,
      templateName: DEFAULT_TEMPLATES.APPLICATION_NOTIFICATION,
      templateData
    });
  } catch (error) {
    console.error("Error sending livestreamer application notification email:", error);
    return false;
  }
}

/**
 * Send notification email to admin about a new apologist scholar application
 */
export async function sendApologistScholarApplicationNotificationEmail(params: LivestreamerApplicationNotificationParams, fullName: any, id: number): Promise<boolean> {
  try {
    // Reuse the same template for now, mapping fields accordingly
    const templateData = {
      applicantName: params.applicantName,
      applicantEmail: params.applicantEmail,
      ministryName: params.ministryName || 'Not specified',
      applicationId: params.applicationId.toString(),
      applicationDate: params.applicationDate,
      reviewLink: params.reviewLink
    };

    return await sendTemplatedEmail({
      to: params.email,
      from: `no-reply@${APP_DOMAIN}`,
      templateName: DEFAULT_TEMPLATES.APPLICATION_NOTIFICATION,
      templateData
    });
  } catch (error) {
    console.error('Error sending apologist scholar application notification email:', error);
    return false;
  }
}

/**
 * Parameters for application status update emails
 */
export interface ApplicationStatusUpdateParams {
  email: string;
  applicantName: string;
  status: string;
  ministryName: string;
  reviewNotes?: string;
  platformLink: string;
}

/**
 * Send email to applicant about their application status update
 */
export async function sendApplicationStatusUpdateEmail(params: ApplicationStatusUpdateParams): Promise<boolean> {
  try {
    const templateData = {
      applicantName: params.applicantName || "Community Member",
      status: params.status,
      ministryName: params.ministryName || "your ministry",
      reviewNotes: params.reviewNotes || "No additional notes provided.",
      platformLink: params.platformLink,
      email: params.email
    };

    return await sendTemplatedEmail({
      to: params.email,
      from: `no-reply@${APP_DOMAIN}`,
      templateName: DEFAULT_TEMPLATES.APPLICATION_STATUS_UPDATE,
      templateData
    });
  } catch (error) {
    console.error("Error sending application status update email:", error);
    return false;
  }
}