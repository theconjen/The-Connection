import rateLimit from 'express-rate-limit';

export const contentCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const messageCreationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: 'Too many messages, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

export const dmSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  message: 'You are sending messages too quickly.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const moderationReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
