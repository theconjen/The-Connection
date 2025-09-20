// Load environment variables from .env file FIRST
import { config } from 'dotenv';
config();

import { S3Client, HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Create S3 client with environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function smokeTest() {
  console.log("🚀 Starting AWS S3 Smoke Test...\n");

  // Check environment variables first
  console.log("🔍 Checking environment variables:");
  console.log(`AWS_REGION: ${process.env.AWS_REGION ? '✅ Set (' + process.env.AWS_REGION + ')' : '❌ Not set'}`);
  console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`S3_BUCKET: "${process.env.S3_BUCKET}" (raw value)\n`);

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ AWS credentials not found in environment variables");
    console.error("Make sure your .env file contains AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  const bucketName = process.env.S3_BUCKET || "do-not-delete-ssm-diagnosis-910606336278-us-east-2-da58d";

  try {

    // First, let's try a simpler test - just check if we can list buckets
    console.log(`🔍 Testing basic S3 connectivity...`);
    try {
      const { ListBucketsCommand } = await import("@aws-sdk/client-s3");
      const listBucketsCommand = new ListBucketsCommand({});
      const bucketsResponse = await s3Client.send(listBucketsCommand);
      console.log(`✅ Successfully connected to S3 (found ${bucketsResponse.Buckets?.length || 0} buckets in your account)`);
    } catch (listError) {
      console.log(`⚠️  Cannot list buckets (this is normal if your IAM user has restricted permissions)`);
      console.log(`   Error: ${listError.name}`);
    }

    // Now test the specific bucket
    const headBucketCommand = new HeadBucketCommand({
      Bucket: bucketName,
    });

    await s3Client.send(headBucketCommand);
    console.log("✅ Bucket exists and is accessible");

    // Test 3: Try to list objects in the bucket (should work even if empty)
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1, // Just check if we can list, don't need all objects
    });

    const listResponse = await s3Client.send(listObjectsCommand);
    console.log(`✅ Successfully listed objects in bucket (found ${listResponse.KeyCount || 0} objects)`);

    console.log("\n🎉 AWS S3 Smoke Test PASSED! Everything is working correctly.");
    console.log("✅ AWS credentials are valid");
    console.log("✅ S3 client can connect to AWS");
    console.log("✅ Bucket exists and is accessible");
    console.log("✅ You have permission to list objects in the bucket");

  } catch (error) {
    console.error("❌ AWS S3 Smoke Test FAILED:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.$metadata?.httpStatusCode);

    if (error.name === 'NoSuchBucket') {
      console.error("❌ The specified bucket does not exist.");
      console.error("💡 Check if the bucket name is correct and exists in your AWS account.");
    } else if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      console.error("❌ Access denied to bucket:", bucketName);
      console.error("💡 This bucket exists but your AWS credentials don't have permission to access it.");
      console.error("💡 Solutions:");
      console.error("   1. Ask your AWS administrator to grant S3 permissions for this bucket");
      console.error("   2. Create a new S3 bucket that you have full access to");
      console.error("   3. Update the S3_BUCKET environment variable to point to a bucket you can access");
      console.error("   4. Check your IAM user's S3 permissions in the AWS console");
    } else if (error.name === 'InvalidAccessKeyId' || error.name === 'InvalidToken') {
      console.error("❌ Invalid AWS Access Key ID. Check your credentials.");
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error("❌ Invalid AWS Secret Access Key. Check your credentials.");
    } else if (error.name === 'NetworkingError' || error.name === 'TimeoutError') {
      console.error("❌ Network error. Check your internet connection.");
    } else {
      console.error("❌ Unknown error occurred. This might be a permissions issue or bucket doesn't exist.");
    }

    process.exit(1);
  }
}

smokeTest();