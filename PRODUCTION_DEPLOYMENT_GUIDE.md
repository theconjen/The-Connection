# Production Deployment Guide

**Last Updated**: 2025-11-20
**Status**: Ready for deployment after completing this checklist

---

## 🚨 CRITICAL: Before You Deploy

### Security Actions (REQUIRED - Do These First!)

#### 1. Rotate Database Password
The database credentials were previously committed to the repository. You MUST rotate them immediately:

1. Go to your [Neon Dashboard](https://neon.tech/dashboard)
2. Navigate to your project: `ep-hidden-band-adzjfzr3`
3. Go to Settings → Reset Password
4. Generate a new strong password
5. Update your `DATABASE_URL` environment variable everywhere (local `.env`, Render dashboard, etc.)

#### 2. Generate Production Secrets

Generate strong, unique secrets for production:

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

Save these somewhere secure (password manager, encrypted notes).

#### 3. Clean Git History (Optional but Recommended)

The repository contains committed secrets in git history. To completely remove them:

```bash
# WARNING: This rewrites git history!
# Coordinate with all team members first

# Option 1: Using BFG Repo-Cleaner (recommended)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --replace-text passwords.txt  # Create passwords.txt with old credentials
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: Using git-filter-repo
# Install: pip install git-filter-repo
git filter-repo --invert-paths --path .env
git filter-repo --replace-text passwords.txt
```

After cleaning, force-push to repository (coordinate with team first):
```bash
git push origin --force --all
```

---

## 📋 Production Deployment Checklist

### Phase 1: Environment Configuration

#### Required Environment Variables

Set these in your Render dashboard (or deployment platform):

```bash
# === CRITICAL SECRETS ===
DATABASE_URL=postgresql://username:NEW_PASSWORD@host/database  # Use NEW rotated password!
SESSION_SECRET=<output from openssl rand -base64 32>
JWT_SECRET=<output from openssl rand -base64 32>

# === APPLICATION SETTINGS ===
NODE_ENV=production
USE_DB=true
COOKIE_SECURE=true  # MUST be true in production!
PORT=3000

# === ERROR MONITORING (Recommended) ===
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# === EMAIL SERVICE (Choose one) ===
# Option A: AWS SES
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
EMAIL_FROM=noreply@yourdomain.com

# Option B: SendGrid
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# === FILE STORAGE (Optional but recommended for avatars) ===
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# === DOMAIN CONFIGURATION ===
APP_DOMAIN=yourdomain.com
BASE_URL=https://yourdomain.com

# === OPTIONAL ===
REDIS_URL=redis://your-redis-url  # Optional: for caching
RATE_LIMIT_MAX=100  # Requests per 15 minutes
```

#### Set Environment Variables in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service: `the-connection-api`
3. Navigate to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable listed above
6. Click **Save Changes**

**IMPORTANT**: The `render.yaml` file is already configured to sync these variables from your Render dashboard. Do NOT hardcode them!

---

### Phase 2: External Services Setup

#### A. Error Monitoring - Sentry (Recommended)

1. Create free account at [Sentry.io](https://sentry.io)
2. Create new project → Select "Node.js"
3. Copy your DSN: `https://xxx@sentry.io/xxx`
4. Add to environment variables: `SENTRY_DSN=<your-dsn>`
5. Sentry will automatically start tracking errors on deployment

#### B. Email Service Setup (Required for password reset, notifications)

**Option 1: AWS SES (Recommended for production)**

1. Go to [AWS Console](https://console.aws.amazon.com/ses/)
2. Navigate to SES → Email Addresses
3. Verify your domain or email address
4. Create IAM user with SES permissions:
   - Policy: `AmazonSESFullAccess`
   - Get Access Key ID and Secret Access Key
5. Add to environment variables

**Option 2: SendGrid (Easier for beginners)**

1. Create account at [SendGrid.com](https://sendgrid.com)
2. Go to Settings → API Keys
3. Create new API key with "Mail Send" permissions
4. Add to environment variables: `SENDGRID_API_KEY=<your-key>`

#### C. File Storage - Google Cloud Storage (Optional)

Required for: User avatars, event images, profile images

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Cloud Storage API
4. Create storage bucket:
   - Name: `theconnection-uploads` (or similar)
   - Location: Multi-region (US or EU)
   - Storage class: Standard
   - Access control: Fine-grained
5. Create service account:
   - Go to IAM → Service Accounts
   - Create service account
   - Grant role: "Storage Admin"
   - Create JSON key
   - Download credentials file
6. Add to environment variables:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_STORAGE_BUCKET=theconnection-uploads
   ```
7. Upload credentials.json to your server (not in git!)

**Alternative**: Use local file storage for MVP (not recommended for production)

---

### Phase 3: Database Setup

#### A. Run Migrations

Migrations run automatically on server startup, but you can run them manually:

```bash
# From server directory
node server/run-migrations.ts
```

Expected output:
```
✅ Database migrations completed
Running organization migrations...
✅ Organization migrations completed
```

#### B. Create Admin User

**IMPORTANT**: Do NOT use hardcoded admin credentials!

```bash
# Set environment variables first
export ADMIN_USERNAME=your_admin_username
export ADMIN_EMAIL=admin@yourdomain.com
export ADMIN_PASSWORD=YourSecure123Password!

# Run admin creation script
npm run create-admin
```

Or use the interactive script:
```bash
node server/create-admin.js
```

#### C. Seed Data (Optional - for testing/demo)

```bash
# Seed all demo data
node server/seed-all.ts

# Or seed specific data
node server/seed-communities.ts
node server/seed-apologetics.ts
node server/seed-prayers.ts
```

**WARNING**: Only seed in development/staging! Not in production!

---

### Phase 4: Deployment to Render

#### A. Deploy Backend

Deployment is automated via `render.yaml`:

1. Push changes to `main` branch:
   ```bash
   git add .
   git commit -m "feat: production readiness fixes"
   git push origin main
   ```

2. Render will automatically:
   - Detect changes
   - Run build command
   - Deploy new version
   - Run health check at `/api/health`

3. Monitor deployment in Render dashboard:
   - Go to your service page
   - Check "Events" tab for build logs
   - Wait for "Deploy live" status

#### B. Verify Deployment

Test these endpoints after deployment:

```bash
# Health check
curl https://your-app.onrender.com/api/health
# Expected: {"ok":true}

# Test registration (use dummy data)
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!@#$%"}'

# Test login
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#$%"}' \
  -c cookies.txt

# Test authenticated endpoint
curl https://your-app.onrender.com/api/user/profile \
  -b cookies.txt
```

All should return valid JSON responses (not errors).

---

### Phase 5: Mobile App Deployment

#### A. Update Mobile API Configuration

1. Edit `mobile-app/TheConnectionMobile/src/utils/constants.ts`:
   ```typescript
   export const API_BASE_URL = 'https://your-app.onrender.com/api';
   ```

2. Or use environment variable:
   ```bash
   # In mobile-app/.env
   EXPO_PUBLIC_API_BASE=https://your-app.onrender.com/api
   ```

#### B. Build Mobile App

```bash
cd mobile-app/TheConnectionMobile

# Login to Expo
npx eas login

# Build for both platforms
npx eas build --platform all --profile production

# Submit to stores
npx eas submit --platform ios
npx eas submit --platform android
```

See `mobile-app/DEPLOYMENT_CHECKLIST.md` for detailed mobile deployment guide.

---

## 🔍 Post-Deployment Verification

### Checklist

- [ ] Health check endpoint returns `{"ok":true}`
- [ ] User registration works
- [ ] User login works
- [ ] Email sending works (test password reset)
- [ ] File uploads work (test avatar upload)
- [ ] Sentry receiving error reports (test by triggering an error)
- [ ] WebSocket connections work (test real-time chat)
- [ ] Database queries working (test fetching communities)
- [ ] SSL/TLS certificate valid
- [ ] No errors in Render logs

### Test User Flow

1. Register new user
2. Verify email (if enabled)
3. Login
4. Update profile
5. Join a community
6. Create a post
7. Upload an avatar
8. Send a direct message
9. Create an event
10. Test real-time chat

---

## 📊 Monitoring & Maintenance

### Daily Checks

- Check Sentry for new errors
- Monitor Render logs for unusual activity
- Check database CPU/memory usage in Neon dashboard

### Weekly Checks

- Review audit logs for suspicious activity:
  ```sql
  SELECT * FROM audit_logs
  WHERE action = 'login_failed'
  AND created_at > NOW() - INTERVAL '7 days'
  ORDER BY created_at DESC;
  ```
- Update dependencies with security patches:
  ```bash
  pnpm update
  ```
- Check for locked accounts:
  ```sql
  SELECT username, lockout_until
  FROM users
  WHERE lockout_until > NOW();
  ```

### Monthly Checks

- Rotate secrets (SESSION_SECRET, JWT_SECRET)
- Review and update SSL certificates
- Database backup verification
- Security audit
- Review user reports

---

## 🚨 Incident Response

### If There's a Security Incident

1. **Immediately**:
   - Take affected service offline if necessary
   - Rotate ALL secrets (database password, SESSION_SECRET, JWT_SECRET)
   - Check audit logs for breach extent
   - Notify affected users if personal data exposed

2. **Within 24 hours**:
   - Patch vulnerability
   - Deploy fix
   - Document incident
   - Review security measures

3. **Within 72 hours**:
   - Conduct post-mortem
   - Update security procedures
   - Train team on lessons learned

### If There's a Database Issue

1. Check Neon dashboard for status
2. Review recent migrations
3. Check disk space and connection limits
4. Restore from backup if needed

### If There's an Application Error

1. Check Sentry for error details
2. Review Render logs
3. Check environment variables are set correctly
4. Verify database connectivity
5. Check external services (email, storage) status

---

## 📞 Support & Resources

### Hosting & Infrastructure

- **Render Support**: https://render.com/docs/support
- **Neon Docs**: https://neon.tech/docs
- **Sentry Docs**: https://docs.sentry.io

### Application Documentation

- **Main README**: `/README.md`
- **Security Guide**: `/SECURITY.md`
- **API Documentation**: `/API_ANALYSIS_REPORT.md`
- **Mobile Deployment**: `/mobile-app/DEPLOYMENT_CHECKLIST.md`

### Emergency Contacts

- Database: Neon Support (support@neon.tech)
- Hosting: Render Support (support@render.com)
- Email: AWS SES or SendGrid support

---

## ✅ Deployment Completion

Once you've completed ALL items above, your app is production-ready!

**Final checklist**:
- [ ] All secrets rotated
- [ ] All environment variables set in Render
- [ ] Sentry configured and receiving events
- [ ] Email service working
- [ ] File storage configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Deployment successful
- [ ] All verification tests passing
- [ ] Mobile apps submitted to stores
- [ ] Monitoring in place

---

**Next Steps**: Monitor your application closely for the first week. Be ready to respond to user feedback and any issues that arise.

**Good luck with your launch! 🚀**
