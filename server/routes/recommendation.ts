import { Router } from 'express';
import { RecommendationService } from '../services/recommendationService';
import { requireAuth } from '../middleware/auth';

const router = Router();
const recommendationService = new RecommendationService();

// Get personalized feed for authenticated user
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const feed = await recommendationService.generatePersonalizedFeed(userId, limit);
    
    res.json({
      success: true,
      data: feed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating personalized feed:', error);
    res.status(500).json({ 
      error: 'Failed to generate personalized feed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Record user interaction for recommendation training
router.post('/interaction', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { contentId, contentType, interactionType } = req.body;

    if (!contentId || !contentType || !interactionType) {
      return res.status(400).json({ 
        error: 'Missing required fields: contentId, contentType, interactionType' 
      });
    }

    const validContentTypes = ['microblog', 'community', 'event'];
    const validInteractionTypes = ['view', 'like', 'comment', 'share'];

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ 
        error: `Invalid contentType. Must be one of: ${validContentTypes.join(', ')}` 
      });
    }

    if (!validInteractionTypes.includes(interactionType)) {
      return res.status(400).json({ 
        error: `Invalid interactionType. Must be one of: ${validInteractionTypes.join(', ')}` 
      });
    }

    await recommendationService.recordInteraction(
      userId,
      parseInt(contentId),
      contentType,
      interactionType
    );

    res.json({ 
      success: true, 
      message: 'Interaction recorded successfully' 
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ 
      error: 'Failed to record interaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's interaction history (for debugging/analytics)
router.get('/interactions', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // This would need to be implemented in the recommendation service
    // For now, return a placeholder
    res.json({
      success: true,
      data: [],
      message: 'Interaction history endpoint - implementation pending'
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch interaction history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Follow/unfollow user endpoint
router.post('/follow/:targetUserId', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const targetUserId = parseInt(req.params.targetUserId);

    if (!userId || !targetUserId || userId === targetUserId) {
      return res.status(400).json({ error: 'Invalid follow request' });
    }

    // This would need to be implemented to handle follow/unfollow
    // For now, return success
    res.json({ 
      success: true, 
      message: 'Follow functionality - implementation pending' 
    });
  } catch (error) {
    console.error('Error handling follow request:', error);
    res.status(500).json({ 
      error: 'Failed to process follow request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as recommendationRouter };