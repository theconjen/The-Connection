import { Request, Response } from "express";
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectAclCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import type {
  ObjectAclPolicy,
} from "./objectAcl";
import {
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
  ObjectPermission,
} from "./objectAcl";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Simple S3 object wrapper to mimic Google Cloud File interface
class S3Object {
  constructor(
    private s3Client: S3Client,
    public bucketName: string,
    public objectName: string
  ) {}

  async exists(): Promise<[boolean]> {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: this.objectName,
      }));
      return [true];
    } catch (error) {
      return [false];
    }
  }

  async getMetadata(): Promise<[{ contentType?: string; size?: number; metadata?: Record<string, string> }]> {
    const response = await this.s3Client.send(new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: this.objectName,
    }));
    return [{
      contentType: response.ContentType,
      size: response.ContentLength,
      metadata: response.Metadata,
    }];
  }

  async setMetadata(metadata: { metadata?: Record<string, string> }): Promise<void> {
    // For S3, we can't directly set metadata without copying the object
    // This is a simplified implementation - in production you'd need to copy the object
    // For now, we'll skip this as ACL policies might be stored differently for S3
    console.warn('setMetadata not fully implemented for S3');
  }

  get name(): string {
    return this.objectName;
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<string | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);

      try {
        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        });
        await this.s3Client.send(command);
        // If we get here, the object exists
        return fullPath;
      } catch (error) {
        // Object doesn't exist, continue to next path
        continue;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(objectPath: string, res: Response, cacheTtlSec: number = 3600) {
    try {
      const { bucketName, objectName } = parseObjectPath(objectPath);

      // Get object metadata first
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });
      const metadata = await this.s3Client.send(headCommand);

      // Get the ACL policy for the object (this might need to be updated for S3)
      // For now, assume public if no ACL policy exists
      const isPublic = true; // TODO: Implement S3 ACL policy checking

      // Set appropriate headers
      res.set({
        "Content-Type": metadata.ContentType || "application/octet-stream",
        "Content-Length": metadata.ContentLength,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the object to the response
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });
      const response = await this.s3Client.send(getCommand);

      if (response.Body) {
        (response.Body as any).pipe(res);
      } else {
        res.status(404).json({ error: "Object body not found" });
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    return this.signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<S3Object> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    
    const s3Object = new S3Object(this.s3Client, bucketName, objectName);
    const [exists] = await s3Object.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return s3Object;
  }

  normalizeObjectEntityPath(
    rawPath: string,
  ): string {
    // Handle S3 URLs (format: https://bucket-name.s3.region.amazonaws.com/key)
    if (rawPath.startsWith("https://") && rawPath.includes(".s3.")) {
      // Extract the path from the S3 URL
      const url = new URL(rawPath);
      const rawObjectPath = url.pathname.slice(1); // Remove leading slash
      
      let objectEntityDir = this.getPrivateObjectDir();
      if (!objectEntityDir.endsWith("/")) {
        objectEntityDir = `${objectEntityDir}/`;
      }
  
      if (!rawObjectPath.startsWith(objectEntityDir)) {
        return rawObjectPath;
      }
  
      // Extract the entity ID from the path
      const entityId = rawObjectPath.slice(objectEntityDir.length);
      return `/objects/${entityId}`;
    }

    // Handle Google Cloud URLs (for backward compatibility during migration)
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      // Extract the path from the URL by removing query parameters and domain
      const url = new URL(rawPath);
      const rawObjectPath = url.pathname;
  
      let objectEntityDir = this.getPrivateObjectDir();
      if (!objectEntityDir.endsWith("/")) {
        objectEntityDir = `${objectEntityDir}/`;
      }
  
      if (!rawObjectPath.startsWith(objectEntityDir)) {
        return rawObjectPath;
      }
  
      // Extract the entity ID from the path
      const entityId = rawObjectPath.slice(objectEntityDir.length);
      return `/objects/${entityId}`;
    }
  
    return rawPath;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    // TODO: Implement S3 ACL policy setting
    // For now, skip ACL setting during migration
    console.warn('ACL policy setting not implemented for S3 migration');
    return normalizedPath;
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: S3Object;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    // For now, implement basic access control
    // TODO: Implement proper ACL checking for S3
    return true; // Allow access for migration
  }

  async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const command = method === "PUT" 
      ? new PutObjectCommand({ Bucket: bucketName, Key: objectName })
      : new GetObjectCommand({ Bucket: bucketName, Key: objectName });

    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: ttlSec });
    return signedUrl;
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}