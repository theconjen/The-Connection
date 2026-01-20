# GOOGLE CLOUD STORAGE SETUP GUIDE
**For**: The Connection - File Upload Configuration
**Last Updated**: 2026-01-10

---

## ✅ WHAT'S ALREADY DONE

I've created a complete, production-ready GCS integration:

1. **Storage Service** (`server/services/storageService.ts`)
   - ✅ Upload files with automatic organization by category
   - ✅ Delete files
   - ✅ Generate signed URLs for temporary access
   - ✅ Health check endpoint
   - ✅ Mock mode when GCS not configured
   - ✅ Supports both credentials file and base64 encoded credentials

2. **Upload Routes** (`server/routes/upload.ts`)
   - ✅ Profile picture upload
   - ✅ Event image upload
   - ✅ Community banner upload
   - ✅ Post attachment upload
   - ✅ File deletion
   - ✅ All routes require authentication

3. **Dependencies**
   - ✅ `@google-cloud/storage` already installed (v7.17.3)

---

## 🔴 WHAT YOU NEED TO DO

### Step 1: Install Multer (5 minutes)

Multer is needed for handling multipart/form-data file uploads:

```bash
cd /Users/rawaselou/Desktop/The-Connection-main
pnpm add multer @types/multer
```

### Step 2: Register Upload Routes (2 minutes)

Add the upload router to your main routes file:

**File**: `/Users/rawaselou/Desktop/The-Connection-main/server/routes.ts`

```typescript
// Add this import at the top
import uploadRoutes from './routes/upload';

// Add this line in the registerRoutes function (with other route registrations)
app.use(uploadRoutes);
```

### Step 3: Set Up Google Cloud Storage (30-60 minutes)

Follow the detailed guide in **RENDER_ENV_CONFIG.md** section "GOOGLE CLOUD STORAGE SETUP"

Quick summary:
1. Create GCS project in Google Cloud Console
2. Create storage bucket: `theconnection-uploads`
3. Create service account with "Storage Object Admin" role
4. Download service account key (JSON file)
5. Add to Render as secret file or base64 encoded

### Step 4: Add Environment Variables

**In Render Dashboard** → Your Service → Environment:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=theconnection-uploads
```

**Choose ONE of these options:**

**Option A: Secret File (Recommended)**
```bash
# Upload the JSON key file as a secret file in Render
# Path: /etc/secrets/gcs-key.json

GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcs-key.json
```

**Option B: Base64 Encoded**
```bash
# Encode the JSON file:
# base64 -i your-key.json | tr -d '\n'

GOOGLE_APPLICATION_CREDENTIALS_BASE64=<paste-encoded-string>
```

---

## 🧪 TESTING

### 1. Test Storage Service Health

After deployment, check the health endpoint:

```bash
curl https://your-app.onrender.com/api/upload/health
```

Expected response:
```json
{
  "ok": true,
  "message": "Connected to GCS bucket: theconnection-uploads",
  "config": {
    "isConfigured": true,
    "projectId": "your-project-id",
    "bucketName": "theconnection-uploads",
    "mockMode": false
  }
}
```

### 2. Test File Upload (Profile Picture)

```bash
# Get auth token first by logging in, then:

curl -X POST https://your-app.onrender.com/api/upload/profile-picture \
  -H "Cookie: sessionId=your-session-cookie" \
  -F "image=@/path/to/test-image.jpg"
```

Expected response:
```json
{
  "url": "https://storage.googleapis.com/theconnection-uploads/profile-pictures/user-123/1704937200000-abc123.jpg",
  "filename": "test-image.jpg",
  "size": 245678
}
```

---

## 📂 FILE ORGANIZATION

Files are automatically organized by category and user:

```
theconnection-uploads/
├── profile-pictures/
│   ├── user-1/
│   │   ├── 1704937200000-abc123.jpg
│   │   └── 1704937300000-def456.png
│   └── user-2/
│       └── 1704937400000-ghi789.jpg
├── event-images/
│   ├── user-5/
│   │   └── 1704937500000-jkl012.jpg
│   └── user-10/
│       └── 1704937600000-mno345.png
├── community-banners/
│   ├── user-3/
│   │   └── 1704937700000-pqr678.jpg
│   └── user-7/
│       └── 1704937800000-stu901.png
└── post-attachments/
    ├── user-8/
    │   ├── 1704937900000-vwx234.pdf
    │   └── 1704938000000-yza567.jpg
    └── user-12/
        └── 1704938100000-bcd890.png
```

---

## 🎨 FRONTEND INTEGRATION

### React Web Client Example

```typescript
// In your component
const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload/profile-picture', {
    method: 'POST',
    credentials: 'include', // Important for session cookies
    body: formData,
  });

  const data = await response.json();
  console.log('Uploaded:', data.url);

  // Update user profile with new image URL
  await updateUserProfile({ profilePicture: data.url });
};
```

### React Native Mobile App Example

```typescript
// Using expo-image-picker
import * as ImagePicker from 'expo-image-picker';

const uploadProfilePicture = async () => {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;

    // Create form data
    const formData = new FormData();
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    // Upload
    const response = await fetch('https://api.theconnection.app/api/upload/profile-picture', {
      method: 'POST',
      headers: {
        'Cookie': `sessionId=${sessionCookie}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log('Uploaded:', data.url);
  }
};
```

---

## 🚨 MOCK MODE (Development/Testing)

If GCS credentials are NOT configured, the service runs in **mock mode**:

- ✅ All endpoints still work
- ✅ Returns mock URLs: `https://storage.mock.theconnection.app/...`
- ✅ No actual files uploaded
- ✅ Perfect for development and testing

**When in mock mode**:
```json
{
  "ok": false,
  "message": "Google Cloud Storage not configured - running in mock mode",
  "config": {
    "isConfigured": false,
    "mockMode": true
  }
}
```

---

## 🔒 SECURITY FEATURES

### Built-in Protections
- ✅ Authentication required on all routes
- ✅ File size limits (5MB-20MB depending on category)
- ✅ MIME type validation (images and PDFs only)
- ✅ User ID embedded in file path
- ✅ Random filenames prevent guessing
- ✅ Automatic metadata tracking (uploader, timestamp)

### File Size Limits
| Category | Max Size |
|----------|----------|
| Profile Pictures | 5MB |
| Event Images | 10MB |
| Community Banners | 10MB |
| Post Attachments | 20MB |
| Prayer Images | 10MB |

### Allowed File Types
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif)
- ✅ WebP (.webp)
- ✅ PDF (.pdf)

To allow additional types, edit `ALLOWED_MIME_TYPES` in `storageService.ts`.

---

## 💰 COST ESTIMATE (Google Cloud Storage)

### Pricing (as of 2026)
- **Storage**: ~$0.02/GB/month
- **Class A operations** (uploads): ~$0.005/1,000 operations
- **Class B operations** (downloads): ~$0.0004/1,000 operations
- **Network egress**: $0.12/GB (first 1GB free/month)

### Example Monthly Costs
**Small app** (100 active users):
- Storage: 10GB = $0.20
- Uploads: 1,000 files = $0.005
- Downloads: 10,000 views = $0.004
- **Total**: ~$0.21/month

**Medium app** (1,000 active users):
- Storage: 100GB = $2.00
- Uploads: 10,000 files = $0.05
- Downloads: 100,000 views = $0.04
- **Total**: ~$2.09/month

**Large app** (10,000 active users):
- Storage: 500GB = $10.00
- Uploads: 50,000 files = $0.25
- Downloads: 1,000,000 views = $0.40
- **Total**: ~$10.65/month

---

## 🔧 ADVANCED CONFIGURATION

### Making Files Private

By default, uploaded files are public. To make them private:

**In `storageService.ts`**, line ~131, change:
```typescript
public: false, // Make file private (was: true)
```

Then use signed URLs for access:
```typescript
import { getSignedUrl } from '../services/storageService';

const signedUrl = await getSignedUrl(fileUrl, 60); // Valid for 60 minutes
```

### Adding Image Optimization

Install Sharp for image resizing:
```bash
pnpm add sharp @types/sharp
```

Add to upload route:
```typescript
import sharp from 'sharp';

// Before uploading
const optimizedBuffer = await sharp(req.file.buffer)
  .resize(800, 800, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toBuffer();

const url = await uploadFile(optimizedBuffer, ...);
```

---

## 📝 CHECKLIST

Before deploying:
- [ ] Install multer: `pnpm add multer @types/multer`
- [ ] Register upload routes in `routes.ts`
- [ ] Create GCS bucket in Google Cloud Console
- [ ] Create service account and download JSON key
- [ ] Add environment variables to Render
- [ ] Deploy and test `/api/upload/health`
- [ ] Test upload with curl or Postman
- [ ] Integrate upload UI in frontend
- [ ] Test file deletion
- [ ] Monitor GCS costs in Google Cloud Console

---

## 🆘 TROUBLESHOOTING

### Error: "Invalid credentials"
**Solution**: Check that service account JSON is valid and has correct permissions

### Error: "Bucket not found"
**Solution**: Verify bucket name matches `GOOGLE_CLOUD_STORAGE_BUCKET` exactly

### Error: "Permission denied"
**Solution**: Ensure service account has "Storage Object Admin" role

### Files upload but are not accessible
**Solution**:
1. Check bucket permissions (should be public)
2. Or use signed URLs for private files

### Mock mode when credentials are set
**Solution**:
1. Check environment variables are set in Render
2. Verify JSON credentials are valid
3. Check server logs for initialization errors

---

## 📚 ADDITIONAL RESOURCES

- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)

---

**Status**: Ready to use once credentials are configured
**Files Created**:
- `server/services/storageService.ts` - Core storage service
- `server/routes/upload.ts` - Upload API routes
- This guide (`GCS_SETUP_GUIDE.md`)

**Next Steps**: Follow Step 1-4 above to enable file uploads
