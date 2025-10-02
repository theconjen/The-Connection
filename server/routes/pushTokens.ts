import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Register or update a push token for the authenticated user
 * POST /api/push-tokens/register
 * Body: { token: string }
 */
router.post('/register', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userId = parseInt(String(req.session.userId));
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Push token is required' });
  }

  try {
    // Store the push token for this user
    // This assumes you have a method in storage to save push tokens
    // For now, we'll just log it and return success
    console.log(`Registering push token for user ${userId}: ${token}`);
    
    // TODO: Implement storage.savePushToken(userId, token);
    // await storage.savePushToken(userId, token);
    
    res.json({ success: true, message: 'Push token registered successfully' });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ message: 'Error registering push token' });
  }
});

/**
 * Remove a push token for the authenticated user
 * POST /api/push-tokens/unregister
 * Body: { token: string }
 */
router.post('/unregister', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userId = parseInt(String(req.session.userId));
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Push token is required' });
  }

  try {
    console.log(`Unregistering push token for user ${userId}: ${token}`);
    
    // TODO: Implement storage.removePushToken(userId, token);
    // await storage.removePushToken(userId, token);
    
    res.json({ success: true, message: 'Push token unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    res.status(500).json({ message: 'Error unregistering push token' });
  }
});

export default router;
