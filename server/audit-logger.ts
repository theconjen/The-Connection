/**
 * Audit Logging Utility for Security Tracking
 *
 * This module provides functions to log security-sensitive operations
 * for compliance, security monitoring, and forensic analysis.
 */

import { db } from './db';
import { auditLogs, InsertAuditLog } from '@shared/schema';
import { Request } from 'express';

export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset'
  | 'email_change'
  | 'admin_login'
  | 'admin_action'
  | 'user_delete'
  | 'user_block'
  | 'user_unblock'
  | 'permission_change'
  | 'security_setting_change'
  | 'data_export'
  | 'data_delete';

export type AuditStatus = 'success' | 'failure' | 'blocked';

interface AuditLogParams {
  userId?: number;
  username?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: number;
  status: AuditStatus;
  details?: Record<string, any>;
  req?: Request; // Express request object for IP and user agent
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const logEntry: InsertAuditLog = {
      userId: params.userId,
      username: params.username,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      ipAddress: params.req ? getClientIp(params.req) : undefined,
      userAgent: params.req?.get('user-agent'),
      status: params.status,
      details: params.details ? JSON.stringify(params.details) : undefined,
    };

    await db.insert(auditLogs).values(logEntry);

    // Log to console for monitoring (can be disabled in production)
  } catch (error) {
    // Never let audit logging crash the application
    console.error('[AUDIT] Failed to create audit log:', error);
  }
}

/**
 * Log a successful login
 */
export async function logLogin(userId: number, username: string, req?: Request): Promise<void> {
  await createAuditLog({
    userId,
    username,
    action: 'login',
    status: 'success',
    req,
  });
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailed(username: string, reason: string, req?: Request): Promise<void> {
  await createAuditLog({
    username,
    action: 'login_failed',
    status: 'failure',
    details: { reason },
    req,
  });
}

/**
 * Log a logout
 */
export async function logLogout(userId: number, username: string, req?: Request): Promise<void> {
  await createAuditLog({
    userId,
    username,
    action: 'logout',
    status: 'success',
    req,
  });
}

/**
 * Log a new user registration
 */
export async function logRegistration(userId: number, username: string, email: string, req?: Request): Promise<void> {
  await createAuditLog({
    userId,
    username,
    action: 'register',
    status: 'success',
    details: { email },
    req,
  });
}

/**
 * Log a password change
 */
export async function logPasswordChange(userId: number, username: string, req?: Request): Promise<void> {
  await createAuditLog({
    userId,
    username,
    action: 'password_change',
    status: 'success',
    req,
  });
}

/**
 * Log an admin action
 */
export async function logAdminAction(
  adminUserId: number,
  adminUsername: string,
  action: string,
  targetEntityType?: string,
  targetEntityId?: number,
  details?: Record<string, any>,
  req?: Request
): Promise<void> {
  await createAuditLog({
    userId: adminUserId,
    username: adminUsername,
    action: 'admin_action',
    entityType: targetEntityType,
    entityId: targetEntityId,
    status: 'success',
    details: { ...details, adminAction: action },
    req,
  });
}

/**
 * Log a user blocking action
 */
export async function logUserBlock(
  moderatorId: number,
  moderatorUsername: string,
  blockedUserId: number,
  reason: string,
  req?: Request
): Promise<void> {
  await createAuditLog({
    userId: moderatorId,
    username: moderatorUsername,
    action: 'user_block',
    entityType: 'user',
    entityId: blockedUserId,
    status: 'success',
    details: { reason },
    req,
  });
}

/**
 * Log a security setting change
 */
export async function logSecuritySettingChange(
  userId: number,
  username: string,
  setting: string,
  oldValue: any,
  newValue: any,
  req?: Request
): Promise<void> {
  await createAuditLog({
    userId,
    username,
    action: 'security_setting_change',
    status: 'success',
    details: { setting, oldValue, newValue },
    req,
  });
}

/**
 * Get client IP address from request, handling proxies
 */
function getClientIp(req: Request): string {
  // Check for X-Forwarded-For header (proxy/load balancer)
  const forwardedFor = req.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can be a comma-separated list; take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Check for X-Real-IP header
  const realIp = req.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fall back to connection remote address
  return req.ip || req.socket.remoteAddress || 'unknown';
}
