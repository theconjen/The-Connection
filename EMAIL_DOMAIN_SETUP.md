# Email Domain Verification - Quick Setup Guide

**Domain:** theconnection.app
**Email Provider:** Resend
**Sending From:** noreply@theconnection.app

---

## Step 1: Login to Resend

1. Go to: https://resend.com/login
2. Login with your credentials
3. Navigate to **"Domains"** in the left sidebar

---

## Step 2: Add Domain (if not already added)

1. Click **"Add Domain"** button
2. Enter: `theconnection.app`
3. Click **"Add"**

---

## Step 3: Get Your DNS Records

Resend will show you DNS records to add. They look like this:

### SPF Record (for sender authentication)
```
Type: TXT
Name: theconnection.app
Value: v=spf1 include:amazonses.com ~all
```

### DKIM Records (for email signing)
```
Type: CNAME
Name: resend._domainkey.theconnection.app
Value: resend._domainkey.u123456.wl.sendgrid.net
```

```
Type: CNAME
Name: resend2._domainkey.theconnection.app
Value: resend2._domainkey.u123456.wl.sendgrid.net
```

### MX Record (for bounces)
```
Type: MX
Name: theconnection.app
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

**⚠️ IMPORTANT:** Your actual values will be different. Copy them from Resend dashboard.

---

## Step 4: Add Records to Your Domain Registrar

### If using Namecheap:

1. Login to: https://namecheap.com
2. Click **"Domain List"**
3. Click **"Manage"** next to theconnection.app
4. Click **"Advanced DNS"** tab
5. Click **"Add New Record"**

**For each record:**

**TXT Record:**
- Type: TXT Record
- Host: @ (or leave blank)
- Value: [paste from Resend]
- TTL: Automatic

**CNAME Records:**
- Type: CNAME Record
- Host: resend._domainkey
- Value: [paste from Resend]
- TTL: Automatic

**MX Record:**
- Type: MX Record
- Host: @ (or leave blank)
- Value: [paste from Resend]
- Priority: 10
- TTL: Automatic

6. Click **"Save All Changes"**

### If using GoDaddy:

1. Login to: https://godaddy.com
2. Go to **"My Products"** → **"Domains"**
3. Click **"DNS"** next to theconnection.app
4. Click **"Add"** for each record

### If using Cloudflare:

1. Login to: https://dash.cloudflare.com
2. Select theconnection.app
3. Click **"DNS"** → **"Records"**
4. Click **"Add record"**
5. Add each record from Resend

**⚠️ Cloudflare Note:** If you have "Proxy status" (orange cloud), click it to turn it gray (DNS only) for MX and TXT records.

---

## Step 5: Verify in Resend

1. Go back to Resend dashboard
2. Click **"Verify DNS Records"** or **"Check Status"**
3. Wait 30 seconds to 5 minutes for DNS propagation
4. Status should change from "Pending" to "Verified" ✅

**If verification fails:**
- Wait longer (DNS can take up to 60 minutes)
- Double-check you copied records exactly
- Make sure no typos in values
- Try "Verify" button again

---

## Step 6: Test Email Sending

Once verified, test by registering a new account:

```bash
# Test registration with curl
curl -X POST https://api.theconnection.app/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "yourrealemail@gmail.com",
    "username": "testuser999",
    "password": "TestPassword123!"
  }'
```

**Expected:**
- Response includes: `"verificationSent": true`
- Email arrives within 30 seconds
- Check spam folder if not in inbox

---

## Troubleshooting

### Issue: "Domain not verified"

**Solution:**
- Wait 5-10 minutes for DNS propagation
- Use https://dnschecker.org to verify records are propagating globally
- Check for typos in DNS records
- Make sure you're editing the correct domain

### Issue: "Email not sending"

**Check backend logs:**
```bash
# On Render.com
1. Go to dashboard.render.com
2. Click your service
3. Click "Logs"
4. Search for: "Verification email sent"
```

**Common causes:**
- Domain not verified in Resend
- RESEND_API_KEY not set in production
- Email provider rate limiting

### Issue: "Emails go to spam"

**Solutions:**
- Make sure SPF, DKIM, and DMARC records are set
- Warm up your domain (send gradually increasing emails)
- Ask recipients to mark as "Not Spam"
- Check email content for spam triggers

---

## DNS Propagation Time

- **Minimum:** 5 minutes
- **Typical:** 15-30 minutes
- **Maximum:** 48 hours (rare)

**Check propagation:**
- https://dnschecker.org
- Enter your domain
- Select "TXT" or "MX" record type
- See if records appear globally

---

## Verification Checklist

- [ ] Added SPF record (TXT)
- [ ] Added DKIM records (2x CNAME)
- [ ] Added MX record (if required)
- [ ] Waited 10+ minutes
- [ ] Verified in Resend dashboard (status = "Verified")
- [ ] Tested by registering account
- [ ] Received verification email
- [ ] Email not in spam folder

---

## Next Steps After Verification

Once verified:

1. ✅ Test registration flow with real email
2. ✅ Check email deliverability
3. ✅ Monitor Resend dashboard for send logs
4. ✅ Update testing checklist with results
5. ✅ Proceed with full app testing

---

## Support

**Resend Support:**
- Docs: https://resend.com/docs
- Email: support@resend.com

**The Connection Support:**
- Email: support@theconnection.app
- Check Render logs for backend issues

---

**Estimated Time:** 10-15 minutes + DNS propagation wait time
