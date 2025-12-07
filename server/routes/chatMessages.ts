import { Router } from 'express';
import { z } from 'zod/v4';
import { IStorage } from '../storage';

export const chatMessagesQuerySchema = z.object({
  roomId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().min(0, { message: 'limit must be non-negative' }).max(200).optional(),
  after: z.coerce.number().int().positive().optional()
});

export function createChatMessagesRouter(storage: IStorage) {
  const router = Router();

  router.get('/chat-rooms/:roomId/messages', async (req, res) => {
    const parsed = chatMessagesQuerySchema.safeParse({
      roomId: req.params.roomId,
      ...req.query
    });

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? 'Invalid query parameters' });
    }

    const { roomId, limit = 50, after } = parsed.data;
    const effectiveLimit = Math.max(0, limit);

    try {
      const messages = after
        ? await storage.getChatMessagesAfter(roomId, after)
        : effectiveLimit === 0
          ? []
          : await storage.getChatMessages(roomId, effectiveLimit);

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  return router;
}

export default createChatMessagesRouter;
