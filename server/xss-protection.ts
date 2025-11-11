/**
 * XSS Protection Utility
 *
 * This module provides functions to sanitize user input and prevent
 * Cross-Site Scripting (XSS) attacks.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe HTML tags while removing potentially dangerous ones
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'ul', 'ol', 'li', 'a', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text - strips all HTML tags
 * Use this for fields that should contain only plain text
 */
export function sanitizePlainText(dirty: string): string {
  if (typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user profile data
 */
export function sanitizeUserProfile(data: {
  displayName?: string;
  bio?: string;
  city?: string;
  state?: string;
  [key: string]: any;
}) {
  return {
    ...data,
    displayName: data.displayName ? sanitizePlainText(data.displayName) : data.displayName,
    bio: data.bio ? sanitizeHtml(data.bio) : data.bio,
    city: data.city ? sanitizePlainText(data.city) : data.city,
    state: data.state ? sanitizePlainText(data.state) : data.state,
  };
}

/**
 * Sanitize community data
 */
export function sanitizeCommunity(data: {
  name?: string;
  description?: string;
  [key: string]: any;
}) {
  return {
    ...data,
    name: data.name ? sanitizePlainText(data.name) : data.name,
    description: data.description ? sanitizeHtml(data.description) : data.description,
  };
}

/**
 * Sanitize post content
 */
export function sanitizePost(data: {
  title?: string;
  content?: string;
  [key: string]: any;
}) {
  return {
    ...data,
    title: data.title ? sanitizePlainText(data.title) : data.title,
    content: data.content ? sanitizeHtml(data.content) : data.content,
  };
}

/**
 * Sanitize comment content
 */
export function sanitizeComment(data: {
  content?: string;
  [key: string]: any;
}) {
  return {
    ...data,
    content: data.content ? sanitizeHtml(data.content) : data.content,
  };
}

/**
 * Sanitize microblog content
 */
export function sanitizeMicroblog(data: {
  content?: string;
  [key: string]: any;
}) {
  return {
    ...data,
    content: data.content ? sanitizeHtml(data.content) : data.content,
  };
}

/**
 * Sanitize event data
 */
export function sanitizeEvent(data: {
  title?: string;
  description?: string;
  location?: string;
  [key: string]: any;
}) {
  return {
    ...data,
    title: data.title ? sanitizePlainText(data.title) : data.title,
    description: data.description ? sanitizeHtml(data.description) : data.description,
    location: data.location ? sanitizePlainText(data.location) : data.location,
  };
}

/**
 * Sanitize prayer request
 */
export function sanitizePrayerRequest(data: {
  title?: string;
  description?: string;
  [key: string]: any;
}) {
  return {
    ...data,
    title: data.title ? sanitizePlainText(data.title) : data.title,
    description: data.description ? sanitizeHtml(data.description) : data.description,
  };
}

/**
 * Sanitize chat message
 */
export function sanitizeChatMessage(content: string): string {
  return sanitizeHtml(content);
}

/**
 * Middleware to sanitize request body
 * Use this on routes that accept user input
 */
export function sanitizeRequestBody(fields: string[] = []) {
  return (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeHtml(req.body[field]);
        }
      }
    }
    next();
  };
}
