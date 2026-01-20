# RENDER.COM ENVIRONMENT CONFIGURATION
**For**: The Connection Production Deployment
**Last Updated**: 2026-01-10

---

## 🎯 REQUIRED ENVIRONMENT VARIABLES FOR RENDER

Copy these environment variables into your Render.com dashboard:

**Service** → **Environment** tab → Add each variable below

---

### 🔴 CRITICAL - MUST SET BEFORE DEPLOYMENT

```bash
# Database
DATABASE_URL=<from-your-neon-dashboard>
USE_DB=true

# Security Secrets (use new values from PRODUCTION_SECRETS.md)
SESSION_SECRET=OnXF8Set7BhsvI2GY86WLQudASJPvkwx79OxzXsvo4g=
JWT_SECRET=wTNeCHx+4DaIBt7HqIjm3ZiU9FEt1mEDS4uEyV1qBnA=

# Production Environment
NODE_ENV=production
COOKIE_SECURE=true

# URLs (update with your actual Render URL)
BASE_URL=https://the-connection-api.onrender.com
API_BASE_URL=https://the-connection-api.onrender.com
APP_DOMAIN=theconnection.app

# Email (Resend)
RESEND_API_KEY=re_QUGEBRmx_GNGeXsknKVijtBYyYy1Mo54x
ENABLE_REAL_EMAIL=true

# Error Tracking
SENTRY_DSN=https://50195a543d2fcd9402cf365144b55262@o4510395566718976.ingest.us.sentry.io/4510395580219392
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_SEND_DEFAULT_PII=true
```

---

### 🟡 RECOMMENDED - FOR FULL FUNCTIONALITY

```bash
# Google Cloud Storage (for file uploads)
# Get these from Google Cloud Console
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=theconnection-uploads
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcs-key.json

# Google Maps Geocoding (for location features)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# CORS (if you have specific origins beyond the defaults)
ALLOWED_ORIGINS=https://theconnection.app,https://app.theconnection.app
```

---

### 🟢 OPTIONAL - ADVANCED FEATURES

```bash
# Redis (for caching, if needed)
REDIS_URL=

# AWS SES (alternative email provider)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# SendGrid (alternative email provider)
SENDGRID_API_KEY=

# Debug logging
DEBUG=false

# Rate limiting
RATE_LIMIT_MAX=100

# Expo (for mobile push notifications)
EXPO_PUBLIC_EAS_PROJECT_ID=c11dcfad-026c-4c8d-8dca-bec9e2bc049a
```

---

## 📋 STEP-BY-STEP SETUP GUIDE

### Step 1: Access Render Dashboard
1. Go to https://dashboard.render.com
2. Log in to your account
3. Find your service: **the-connection-api**

### Step 2: Navigate to Environment
1. Click on your service
2. Click **Environment** in the left sidebar
3. You'll see existing environment variables (if any)

### Step 3: Add/Update Variables
For each variable in the "CRITICAL" section above:

1. Click **Add Environment Variable**
2. Enter the **Key** (e.g., `NODE_ENV`)
3. Enter the **Value** (e.g., `production`)
4. Click **Save**

Repeat for all variables.

### Step 4: Update Secrets
⚠️ **IMPORTANT**: Use the NEW secrets from `PRODUCTION_SECRETS.md`:

```bash
SESSION_SECRET=OnXF8Set7BhsvI2GY86WLQudASJPvkwx79OxzXsvo4g=
JWT_SECRET=wTNeCHx+4DaIBt7HqIjm3ZiU9FEt1mEDS4uEyV1qBnA=
```

**DO NOT** use the development secrets from your local `.env` file.

### Step 5: Update URLs
Replace placeholder URLs with your actual Render deployment URL:

```bash
# Find your Render URL (looks like: https://your-service-name.onrender.com)
BASE_URL=https://the-connection-api.onrender.com
API_BASE_URL=https://the-connection-api.onrender.com
```

Or if you have a custom domain:
```bash
BASE_URL=https://api.theconnection.app
API_BASE_URL=https://api.theconnection.app
```

### Step 6: Save and Deploy
1. Click **Save Changes** (bottom of Environment page)
2. Render will automatically trigger a new deployment
3. Wait for deployment to complete (usually 5-10 minutes)

### Step 7: Verify Deployment
1. Check deployment logs for errors
2. Test health endpoint: `https://your-app.onrender.com/api/health`
   - Should return: `{"ok": true}`
3. Test login functionality
4. Check Sentry dashboard for errors

---

## 🔐 GOOGLE CLOUD STORAGE SETUP (Optional but Recommended)

If you want file uploads to work (profile pictures, event images):

### 1. Create GCS Project
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Note the **Project ID**

### 2. Create Storage Bucket
1. Go to **Cloud Storage** → **Buckets**
2. Click **Create Bucket**
   - Name: `theconnection-uploads` (or your choice)
   - Location: `US` (multi-region)
   - Storage class: `Standard`
   - Access control: `Uniform`
3. Click **Create**

### 3. Create Service Account
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
   - Name: `theconnection-storage`
   - Description: `Storage access for The Connection app`
3. Click **Create and Continue**
4. Grant role: **Storage Object Admin**
5. Click **Done**

### 4. Create Key
1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Click **Create**
6. A JSON file will download - keep it safe!

### 5. Add to Render
You have two options:

**Option A: Upload as Secret File**
1. In Render dashboard → **Environment**
2. Click **Add Secret File**
3. Name: `/etc/secrets/gcs-key.json`
4. Paste contents of the JSON file
5. Save

Then add environment variable:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcs-key.json
```

**Option B: Base64 Encode**
1. Encode the JSON file:
```bash
base64 -i path/to/your-key.json | tr -d '\n'
```
2. Add to Render environment:
```bash
GOOGLE_APPLICATION_CREDENTIALS_BASE64=<paste-encoded-string>
```

Also add:
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=theconnection-uploads
```

---

## 🗺️ GOOGLE MAPS GEOCODING SETUP (Optional)

For location search features:

### 1. Create API Key
1. Go to https://console.cloud.google.com
2. Select your project (or create new)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy the API key

### 2. Enable Geocoding API
1. Go to **APIs & Services** → **Library**
2. Search for "Geocoding API"
3. Click on it and click **Enable**

### 3. Restrict API Key (Recommended)
1. Go back to **Credentials**
2. Click on your API key
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose **Geocoding API**
4. Click **Save**

### 4. Add to Render
```bash
GOOGLE_MAPS_API_KEY=your-api-key-here
```

---

## ✅ POST-DEPLOYMENT VERIFICATION CHECKLIST

After setting all environment variables and deploying:

- [ ] **Health Check**: Visit `https://your-app.onrender.com/api/health`
  - Should return `{"ok": true}`

- [ ] **Database Connection**: Check logs for:
  ```
  ✅ Database migrations completed
  ```

- [ ] **User Registration**: Try creating a new account
  - Should receive verification email
  - Should be able to log in

- [ ] **File Upload** (if GCS configured): Try uploading profile picture
  - Should upload successfully
  - Image should be accessible

- [ ] **Location Search** (if Maps configured): Try event location
  - Should return location suggestions

- [ ] **Sentry**: Check Sentry dashboard
  - Should show deployment event
  - Test error by visiting non-existent route

- [ ] **Performance**: Check response times
  - API should respond < 500ms
  - Health check should be < 100ms

---

## 🚨 TROUBLESHOOTING

### Issue: "Database connection failed"
**Solution**: Verify `DATABASE_URL` is correct and includes `?sslmode=require`

### Issue: "Sessions not persisting"
**Solution**:
- Verify `USE_DB=true`
- Verify `SESSION_SECRET` is set
- Check `COOKIE_SECURE=true` (must be true for HTTPS)

### Issue: "CORS errors in browser"
**Solution**:
- Verify frontend domain is in CORS whitelist
- Check `ALLOWED_ORIGINS` includes your domain
- Or verify domain matches Vercel pattern in `server/cors.ts`

### Issue: "File uploads failing"
**Solution**:
- Verify GCS credentials are correct
- Check bucket exists and has proper permissions
- Verify service account has `Storage Object Admin` role

### Issue: "Email not sending"
**Solution**:
- Verify `RESEND_API_KEY` is correct
- Check `ENABLE_REAL_EMAIL=true`
- Check Resend dashboard for delivery status

### Issue: "All users logged out"
**Solution**: This is expected after rotating `SESSION_SECRET`
- All sessions are invalidated
- Users need to log in again
- Normal behavior when rotating secrets

---

## 📞 SUPPORT

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Google Cloud Docs**: https://cloud.google.com/docs
- **Sentry Docs**: https://docs.sentry.io

---

## 🔄 UPDATING ENVIRONMENT VARIABLES

To update environment variables after deployment:

1. Go to Render dashboard → Your service → **Environment**
2. Find the variable you want to update
3. Click the pencil icon ✏️
4. Enter new value
5. Click **Save**
6. Render will automatically redeploy

**Note**: Changing secrets (SESSION_SECRET, JWT_SECRET) will log out all users.

---

**Last Updated**: 2026-01-10
**Next Review**: After first production deployment
