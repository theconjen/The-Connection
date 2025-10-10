const APP_DOMAIN = process.env.APP_DOMAIN || "www.theconnection.app";
const BASE_URL = `https://${APP_DOMAIN}`;
function getFullUrl(path) {
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${formattedPath}`;
}
const EMAIL_FROM = process.env.AWS_SES_FROM_EMAIL || `The Connection <noreply@${APP_DOMAIN}>`;
const APP_URLS = {
  // Auth
  AUTH: getFullUrl("/auth"),
  RESET_PASSWORD: getFullUrl("/reset-password"),
  // Admin
  ADMIN_DASHBOARD: getFullUrl("/admin"),
  ADMIN_LIVESTREAMER_APPLICATIONS: getFullUrl("/admin/livestreamer-applications"),
  ADMIN_APOLOGIST_APPLICATIONS: getFullUrl("/admin/apologist-scholar-applications"),
  // User features
  LIVESTREAMS: getFullUrl("/livestreams"),
  LIVESTREAM_CREATE: getFullUrl("/livestreams/create"),
  LIVESTREAMER_APPLICATION: getFullUrl("/livestreamer-application"),
  APOLOGETICS_QUESTIONS: getFullUrl("/apologetics/questions"),
  APOLOGIST_APPLICATION: getFullUrl("/apologist-scholar-application")
};
export {
  APP_DOMAIN,
  APP_URLS,
  BASE_URL,
  EMAIL_FROM,
  getFullUrl
};
