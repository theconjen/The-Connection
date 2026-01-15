# 🚀 DEPLOY TO RENDER - STEP-BY-STEP GUIDE

**Date:** January 14, 2026
**Status:** ✅ Ready to Deploy
**Repository:** https://github.com/theconjen/The-Connection
**Branch:** main

---

## ✅ WHAT'S READY

- ✅ **All code pushed to GitHub** (latest commit: a9343af)
- ✅ **render.yaml configured** with correct repository URL
- ✅ **Build script ready** (runs migrations automatically)
- ✅ **Mobile media fixes deployed** (ImagePicker & FileSystem APIs fixed)
- ✅ **Database migrations ready** to run on deployment

---

## 📋 DEPLOYMENT STEPS

### **Step 1: Access Render Dashboard** (2 minutes)

1. Go to: **https://dashboard.render.com**
2. Log in to your Render account
3. Look for existing services or click **New +** to create new

---

### **Step 2A: If Service Already Exists**

If you see **"the-connection-api"** service:

1. Click on **the-connection-api** service
2. Go to **Settings** tab
3. Scroll to **Repository** section
4. Verify it says: `https://github.com/theconjen/The-Connection`
5. If wrong, click **Edit** and update to correct URL
6. Go to **Manual Deploy** tab
7. Click **Deploy latest commit** button
8. Skip to **Step 3**

---

### **Step 2B: If No Service Exists (Fresh Setup)**

1. Click **New +** → **Web Service**
2. Click **Connect a repository**
3. Authorize GitHub access if needed
4. Select repository: **theconjen/The-Connection**
5. Click **Connect**

**Configure Service:**
- **Name:** `the-connection-api`
- **Region:** `Ohio (US East)`
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:** (leave auto-detected - will use render.yaml)
- **Start Command:** (leave auto-detected - will use render.yaml)
- **Plan:** `Starter ($7/month)` or `Free` for testing

6. Click **Create Web Service** (don't worry about env vars yet)

---

### **Step 3: Configure Environment Variables** (15 minutes)

**CRITICAL:** The service will fail without these variables!

1. Click on your **the-connection-api** service
2. Go to **Environment** tab
3. Add each variable below:

#### 🔴 **REQUIRED - MUST SET**

```bash
# Database (Get from Neon dashboard)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
USE_DB=true

# Security Secrets (NEVER use development values!)
SESSION_SECRET=OnXF8Set7BhsvI2GY86WLQudASJPvkwx79OxzXsvo4g=
JWT_SECRET=wTNeCHx+4DaIBt7HqIjm3ZiU9FEt1mEDS4uEyV1qBnA=

# Production Environment
NODE_ENV=production
COOKIE_SECURE=true
NODE_VERSION=22

# Email (Resend - required for verification emails)
RESEND_API_KEY=re_QUGEBRmx_GNGeXsknKVijtBYyYy1Mo54x
ENABLE_REAL_EMAIL=true

# Error Tracking
SENTRY_DSN=https://50195a543d2fcd9402cf365144b55262@o4510395566718976.ingest.us.sentry.io/4510395580219392
```

#### 🟡 **OPTIONAL - For File Uploads**

```bash
# Google Cloud Storage (if you set it up)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=theconnection-uploads
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcs-key.json

# Google Maps API (for location search)
GOOGLE_MAPS_API_KEY=your-api-key
```

#### 🟢 **OPTIONAL - Advanced**

```bash
# Bot accounts
BOT_PASSWORD=SecurePasswordForBots123!

# AWS SES (alternative email)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# CORS (if you have specific domains)
ALLOWED_ORIGINS=https://theconnection.app,https://app.theconnection.app
```

---

### **Step 4: Save and Deploy** (1 minute)

1. Scroll to bottom of Environment page
2. Click **Save Changes** button
3. Render will automatically start deploying

---

### **Step 5: Monitor Deployment** (5-10 minutes)

1. Go to **Logs** tab
2. Watch for these key messages:

**✅ Good Signs:**
```
render-build: running database migrations
✅ Database migrations completed
render-build: running pnpm run build
Build successful
Server started on port 10000
```

**❌ Watch For Errors:**
```
Database connection failed → Check DATABASE_URL
Session store error → Check SESSION_SECRET
ELIFECYCLE error → Build issue (contact me)
```

---

### **Step 6: Verify Deployment** (5 minutes)

Once deployment shows **"Live"** (green dot):

1. **Test Health Endpoint:**
   - Visit: `https://the-connection-api.onrender.com/api/health`
   - Should see: `{"ok": true}`

2. **Test Database Connection:**
   - Check logs for: `✅ Database migrations completed`

3. **Test CORS (if you have frontend):**
   - Try logging in from your web app
   - Should not see CORS errors

---

## 🔄 SETUP CONTENT BOTS (Optional)

The bot service posts Bible verses and theology quotes automatically.

1. In Render dashboard, click **New +** → **Background Worker**
2. Connect same repository: `theconjen/The-Connection`
3. Configure:
   - **Name:** `content-bots`
   - **Region:** `Ohio (US East)`
   - **Branch:** `main`
   - **Build Command:** (auto-detected from render.yaml)
   - **Start Command:** `pnpm bots:scheduler`
   - **Plan:** `Starter ($7/month)` or `Free`

4. Add environment variables:
```bash
NODE_ENV=production
NODE_VERSION=22
DATABASE_URL=<same as web service>
BOT_PASSWORD=SecurePasswordForBots123!
```

5. Click **Create Background Worker**

---

## 🎯 POST-DEPLOYMENT CHECKLIST

After deployment is live:

- [ ] **Health check works:** Visit `/api/health`
- [ ] **Database connected:** Check logs for migration success
- [ ] **Create test account:** Try registering a new user
- [ ] **Test login:** Log in with test account
- [ ] **Check email:** Verify verification email arrives
- [ ] **Test media upload:** Upload a profile picture
- [ ] **Check Sentry:** Go to Sentry dashboard, should show deployment
- [ ] **Test mobile app:** Connect mobile app to API

---

## 🚨 TROUBLESHOOTING

### Issue: "Build failed - cannot find module"
**Solution:**
- Check logs for specific module name
- May need to clear build cache: Settings → Clear build cache → Deploy

### Issue: "Database connection failed"
**Solution:**
- Verify DATABASE_URL is correct
- Must include `?sslmode=require` at end
- Check Neon dashboard to ensure database is active

### Issue: "Session errors / users can't log in"
**Solution:**
- Verify SESSION_SECRET is set
- Verify COOKIE_SECURE=true
- Verify USE_DB=true

### Issue: "CORS errors in browser"
**Solution:**
- Check server logs for actual frontend domain
- Add to ALLOWED_ORIGINS or verify Vercel pattern in code

### Issue: "Deployment times out"
**Solution:**
- Render free tier can take 10-15 minutes
- Check logs for hanging process
- May need to upgrade to Starter plan

---

## 📞 NEXT STEPS AFTER DEPLOYMENT

1. **Set up custom domain** (optional):
   - Go to Settings → Custom Domain
   - Add your domain (e.g., api.theconnection.app)
   - Follow DNS instructions

2. **Enable auto-deploy** (recommended):
   - Settings → Auto-Deploy: **Enabled**
   - Every push to `main` will auto-deploy

3. **Set up health checks** (optional):
   - Settings → Health & Alerts
   - Path: `/api/health`
   - Interval: 1 minute

4. **Monitor performance:**
   - Check Render metrics dashboard
   - Check Sentry for errors
   - Monitor database performance in Neon

5. **Connect frontend:**
   - Update frontend API_BASE_URL to Render URL
   - Deploy frontend (Vercel recommended)
   - Test full flow

---

## 📚 REFERENCE DOCUMENTS

- **Environment Config:** `/RENDER_ENV_CONFIG.md`
- **Pre-Deployment Checklist:** `/PRE_DEPLOYMENT_CHECKLIST.md`
- **Production Secrets:** `/PRODUCTION_SECRETS.md`
- **GCS Setup:** `/GCS_SETUP_GUIDE.md`

---

## 🎉 SUCCESS METRICS

Your deployment is successful when:

✅ Health endpoint returns `{"ok": true}`
✅ Logs show "Server started on port 10000"
✅ Database migrations completed without errors
✅ Can register and log in as new user
✅ Receive verification email
✅ Sentry dashboard shows deployment event
✅ No errors in Render logs after 5 minutes

---

## 🆘 NEED HELP?

If you get stuck:
1. Check the **Logs** tab in Render
2. Look for red error messages
3. Copy the error and ask me for help
4. Include: error message + which step you're on

---

**Ready to deploy? Start with Step 1!** 🚀

**Last Updated:** January 14, 2026
**Next Review:** After first successful deployment
