import rateLimit from 'express-rate-limit';

export const CONTENT_CREATION_MAX = 20;
export const MESSAGE_CREATION_MAX = 30;
export const DM_SEND_MAX = 25;
export const MODERATION_REPORT_MAX = 10;

export const contentCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: CONTENT_CREATION_MAX,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Attach options for backward-compatibility with tests that inspect it
(contentCreationLimiter as any).options = {
  windowMs: 15 * 60 * 1000,
  max: CONTENT_CREATION_MAX,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

export const messageCreationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: MESSAGE_CREATION_MAX,
  message: 'Too many messages, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});
(messageCreationLimiter as any).options = {
  windowMs: 1 * 60 * 1000,
  max: MESSAGE_CREATION_MAX,
  message: 'Too many messages, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
};

export const dmSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: DM_SEND_MAX,
  message: 'You are sending messages too quickly.',
  standardHeaders: true,
  legacyHeaders: false,
});
(dmSendLimiter as any).options = {
  windowMs: 60 * 1000,
  max: DM_SEND_MAX,
  message: 'You are sending messages too quickly.',
  standardHeaders: true,
  legacyHeaders: false,
};

export const moderationReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: MODERATION_REPORT_MAX,
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
(moderationReportLimiter as any).options = {
  windowMs: 15 * 60 * 1000,
  max: MODERATION_REPORT_MAX,
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};
