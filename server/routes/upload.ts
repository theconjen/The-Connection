/**
 * File Upload Routes
 * Handles file uploads for The Connection app
 *
 * To use this module:
 * 1. Install multer: pnpm add multer @types/multer
 * 2. Configure GCS credentials in .env
 * 3. Register this router in routes.ts
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import {
  uploadFile,
  deleteFile,
  UploadCategory,
  validateMimeType,
  storageConfig,
  healthCheck,
} from '../services/storageService';
import { isAuthenticated } from '../auth';
import { requireSessionUserId } from '../utils/session';

const router = Router();

// Configure multer for memory storage (we'll upload to GCS directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow images for now
    if (validateMimeType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

/**
 * Health check for storage service
 */
router.get('/api/upload/health', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const health = await healthCheck();
    res.json({
      ...health,
      config: storageConfig,
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * Upload profile picture
 * POST /api/upload/profile-picture
 */
router.post(
  '/api/upload/profile-picture',
  isAuthenticated,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const userId = requireSessionUserId(req);

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const url = await uploadFile(
        req.file.buffer,
        UploadCategory.PROFILE_PICTURES,
        req.file.originalname,
        userId
      );

      res.json({
        url,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Upload event image
 * POST /api/upload/event-image
 */
router.post(
  '/api/upload/event-image',
  isAuthenticated,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const userId = requireSessionUserId(req);

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const url = await uploadFile(
        req.file.buffer,
        UploadCategory.EVENT_IMAGES,
        req.file.originalname,
        userId
      );

      res.json({
        url,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error uploading event image:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Upload community banner
 * POST /api/upload/community-banner
 */
router.post(
  '/api/upload/community-banner',
  isAuthenticated,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const userId = requireSessionUserId(req);

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const url = await uploadFile(
        req.file.buffer,
        UploadCategory.COMMUNITY_BANNERS,
        req.file.originalname,
        userId
      );

      res.json({
        url,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error uploading community banner:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Upload post attachment
 * POST /api/upload/post-attachment
 */
router.post(
  '/api/upload/post-attachment',
  isAuthenticated,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const userId = requireSessionUserId(req);

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const url = await uploadFile(
        req.file.buffer,
        UploadCategory.POST_ATTACHMENTS,
        req.file.originalname,
        userId
      );

      res.json({
        url,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error: any) {
      console.error('Error uploading post attachment:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// VIDEO UPLOAD
// ============================================================================

// Configure multer for video uploads (higher file size limit)
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only mp4, mov, webm, and avi videos are allowed.'));
    }
  },
});

/**
 * Upload video
 * POST /api/upload/video
 */
router.post(
  '/api/upload/video',
  isAuthenticated,
  videoUpload.single('video'),
  async (req: Request, res: Response) => {
    try {
      const userId = requireSessionUserId(req);

      if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }

      const url = await uploadFile(
        req.file.buffer,
        UploadCategory.POST_ATTACHMENTS,
        req.file.originalname,
        userId
      );

      res.json({
        url,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        mediaType: 'video',
      });
    } catch (error: any) {
      console.error('Error uploading video:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Delete uploaded file
 * DELETE /api/upload/:category/:filename
 */
router.delete(
  '/api/upload',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'File URL required' });
      }

      const deleted = await deleteFile(url);

      res.json({
        deleted,
        url,
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
