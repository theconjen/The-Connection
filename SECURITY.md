# Security Documentation

## Overview

This document outlines the security measures implemented in The Connection application and provides guidelines for secure deployment and operation.

## 🔒 Security Features Implemented

### 1. Authentication & Authorization

#### Password Security
- **Argon2id hashing**: All new passwords are hashed with Argon2id (memory-hard configuration) and legacy bcrypt hashes are
  automatically upgraded after the next successful login
- **Strong password requirements**:
  - Minimum 12 characters
  - Must contain uppercase letters
  - Must contain lowercase letters
  - Must contain numbers
  - Must contain special characters

#### Account Protection
- **Account lockout**: After 5 failed login attempts, accounts are locked for 15 minutes
- **Session management**: Sessions expire after 7 days
- **Secure session storage**: Sessions stored in PostgreSQL (when USE_DB=true)
- **Timing-safe failures**: Missing accounts still perform password hashing work to reduce username enumeration via response timing
- **Login audit trail**: Successful and failed logins are captured for investigation and alerting

#### Authentication Endpoints
- **Rate limiting**:
  - Login: 5 attempts per 15 minutes per IP
  - Registration: 3 attempts per hour per IP
  - Magic code requests: 5 per 15 minutes per IP
  - Magic code verification: 10 per 15 minutes per IP

### 2. XSS Protection

**Input sanitization** is implemented using DOMPurify for all user-generated content:
- User profiles (displayName, bio, city, state)
- Community data (name, description)
- Posts and comments
- Microblogs
- Events
- Prayer requests
- Chat messages

**Usage**: Import sanitization functions from `server/xss-protection.ts`

### 3. Security Headers

Implemented using Helmet.js:
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS)
- X-XSS-Protection
- Referrer-Policy

### 4. Audit Logging

All security-sensitive operations are logged to the `audit_logs` table:
- Login attempts (successful and failed)
- Logout events
- User registration
- Password changes
- Admin actions
- User blocking
- Security setting changes

**Access audit logs**: Query the `audit_logs` table or use the audit logger functions in `server/audit-logger.ts`

### 5. Socket.IO Security

- **Authentication required**: All Socket.IO connections must provide a valid userId
- **User verification**: Users can only join rooms they're authorized for
- **Message sender verification**: Cannot spoof messages from other users

### 6. CSRF Protection

CSRF protection is enabled via Lusca middleware on all state-changing operations.

### 7. Rate Limiting

- **Global rate limit**: 100 requests per 15 minutes per IP
- **Endpoint-specific limits**: See Authentication & Authorization section

## 🚀 Deployment Security Checklist

### Environment Variables (REQUIRED)

1. **DATABASE_URL** (CRITICAL)
   ```bash
   # Generate a secure connection string with strong password
   DATABASE_URL=postgresql://username:strong_password@host:5432/database
   ```

2. **SESSION_SECRET** (CRITICAL)
   ```bash
   # Generate with: openssl rand -base64 32
   SESSION_SECRET=your-secret-here
   ```

3. **JWT_SECRET** (CRITICAL)
   ```bash
   # Generate with: openssl rand -base64 32
   JWT_SECRET=your-jwt-secret-here
   ```

### Production Configuration

1. **Set NODE_ENV to production**
   ```bash
   NODE_ENV=production
   ```

2. **Enable secure cookies**
   ```bash
   COOKIE_SECURE=true
   ```

3. **Pick an appropriate SameSite policy for session cookies**
   - Default is `lax`, which protects against most CSRF attacks while allowing top-level navigations.
   - Set `SESSION_SAMESITE=none` only when you must share cookies across domains (and only over HTTPS, since `secure` is forced on when `none` is used).

3. **Use HTTPS**: Ensure your application is served over HTTPS in production

4. **Database sessions**
   ```bash
   USE_DB=true
   ```

### Creating Admin Users

**NEVER use hardcoded credentials!** Use environment variables:

```bash
# Set admin credentials as environment variables
export ADMIN_USERNAME=your_admin_username
export ADMIN_EMAIL=admin@yourdomain.com
export ADMIN_PASSWORD=YourSecure123Password!

# Run the admin creation script
npm run create-admin
```

### Database Migrations

The application automatically runs migrations on startup. The following security-related tables are created:
- `audit_logs` - Security audit trail
- Users table includes `loginAttempts` and `lockoutUntil` fields

## 🛡️ Security Best Practices

### For Developers

1. **Never commit sensitive data**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables for all secrets
   - Never hardcode credentials or API keys

2. **Input validation**
   - Always validate user input on the server side
   - Use Zod schemas for type validation
   - Sanitize all user-generated content using XSS protection utilities

3. **SQL injection prevention**
   - Use Drizzle ORM parameterized queries (already implemented)
   - Never concatenate user input into SQL queries

4. **Audit logging**
   - Log all security-sensitive operations
   - Use the audit logger functions in `server/audit-logger.ts`

5. **Error handling**
  - Don't expose stack traces in production
  - Use generic error messages for authentication failures
  - Log detailed errors server-side for debugging
  - Keep account lockouts and login failures flowing into the audit log for visibility

6. **Session lifecycle hygiene**
   - Session IDs are rotated on login and logout to mitigate fixation; avoid bypassing the provided helpers.
   - Keep cookies `httpOnly` and prefer `SameSite=lax` unless cross-site embedding is required.

### For System Administrators

1. **Keep dependencies updated**
   ```bash
   pnpm update
   npm audit fix
   ```

2. **Monitor audit logs**
   - Regularly review `audit_logs` table
   - Set up alerts for suspicious activity
   - Monitor failed login attempts

3. **Database security**
   - Use strong database passwords
   - Restrict database access by IP
   - Enable database encryption at rest
   - Regular backups

4. **Infrastructure security**
   - Use firewalls to restrict access
   - Keep OS and software updated
   - Use intrusion detection systems
   - Implement DDoS protection

5. **SSL/TLS**
   - Use strong cipher suites
   - Keep certificates up to date
   - Use HSTS headers (already enabled)

## 🔍 Security Monitoring

### Key Metrics to Monitor

1. **Failed login attempts**: Check `audit_logs` for patterns
2. **Account lockouts**: Monitor for brute force attacks
3. **Rate limit violations**: Check server logs
4. **Unusual IP addresses**: Review audit logs for geographic anomalies
5. **Admin actions**: All admin actions are logged

### Query Examples

```sql
-- Recent failed login attempts
SELECT * FROM audit_logs
WHERE action = 'login_failed'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Locked accounts
SELECT username, lockout_until
FROM users
WHERE lockout_until > NOW();

-- Admin actions in last 24 hours
SELECT * FROM audit_logs
WHERE action = 'admin_action'
AND created_at > NOW() - INTERVAL '24 hours';
```

## 📞 Security Incident Response

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security contact: [Add your security email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 🔄 Regular Security Tasks

### Daily
- Monitor audit logs for suspicious activity
- Check failed login attempts

### Weekly
- Review locked accounts
- Update dependencies with security patches

### Monthly
- Full security audit
- Review and rotate access keys
- Update SSL certificates (if needed)
- Review user permissions

### Quarterly
- Penetration testing
- Security training for team
- Review and update security policies

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 📄 Compliance

This application implements security controls that align with:
- OWASP Top 10 protection
- GDPR-compliant audit logging
- SOC 2 security requirements

---

**Last Updated**: 2025-01-10
**Security Contact**: [Add your contact information]
