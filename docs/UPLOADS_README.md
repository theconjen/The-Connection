# Uploads CORS Configuration

Apply the CORS policy in `s3-cors.json` to the S3 bucket that receives uploads:

1. Sign in to the AWS Console and open **S3**.
2. Choose the bucket used for Connection uploads.
3. Navigate to **Permissions ➜ CORS configuration**.
4. Replace the existing configuration with the contents of `s3-cors.json` and save.

The policy allows credentialed requests from `https://app.theconnection.app` and mobile webviews, exposing the headers the uploader relies on.
