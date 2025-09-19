/**
 * Domain configuration utility for The Connection
 * 
 * This file centralizes all domain-related configurations and URL generation
 * for consistent references throughout the application.
 */

export const APP_DOMAIN = process.env.APP_DOMAIN || 'www.theconnection.app';

// Base URL with protocol
export const BASE_URL = `https://${APP_DOMAIN}`;

/**
 * Generate a full URL for a specific path
 * 
 * @param path - The path to append to the base URL
 * @returns A fully formed URL
 */
export function getFullUrl(path: string): string {
  // Ensure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${formattedPath}`;
}

/**
 * Email constants
 */
export const EMAIL_FROM = process.env.AWS_SES_FROM_EMAIL || `The Connection <noreply@${APP_DOMAIN}>`;

/**
 * Common URLs used throughout the application
 */
export const APP_URLS = {
  // Auth
  AUTH: getFullUrl('/auth'),
  RESET_PASSWORD: getFullUrl('/reset-password'),
  
  // Admin
  ADMIN_DASHBOARD: getFullUrl('/admin'),
  ADMIN_LIVESTREAMER_APPLICATIONS: getFullUrl('/admin/livestreamer-applications'),
  ADMIN_APOLOGIST_APPLICATIONS: getFullUrl('/admin/apologist-scholar-applications'),
  
  // User features
  LIVESTREAMS: getFullUrl('/livestreams'),
  LIVESTREAM_CREATE: getFullUrl('/livestreams/create'),
  LIVESTREAMER_APPLICATION: getFullUrl('/livestreamer-application'),
  APOLOGETICS_QUESTIONS: getFullUrl('/apologetics/questions'),
  APOLOGIST_APPLICATION: getFullUrl('/apologist-scholar-application'),
};