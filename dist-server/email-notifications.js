import { DEFAULT_TEMPLATES, sendTemplatedEmail } from "./email.js";
import { APP_DOMAIN } from "./config/domain.js";
async function sendLivestreamerApplicationNotificationEmail(params, fullName, id) {
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
async function sendApologistScholarApplicationNotificationEmail(params, fullName, id) {
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
    console.error("Error sending apologist scholar application notification email:", error);
    return false;
  }
}
async function sendApplicationStatusUpdateEmail(params) {
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
export {
  sendApologistScholarApplicationNotificationEmail,
  sendApplicationStatusUpdateEmail,
  sendLivestreamerApplicationNotificationEmail
};
