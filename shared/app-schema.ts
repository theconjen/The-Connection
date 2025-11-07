import { z } from 'zod/v4';

/** API-facing shapes (client contracts) */
export const ApiUserZ = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});
export type ApiUser = z.infer<typeof ApiUserZ>;

export const AuthLoginReqZ = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type AuthLoginReq = z.infer<typeof AuthLoginReqZ>;

export const FeedItemZ = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
});
export const FeedZ = z.array(FeedItemZ);
export type Feed = z.infer<typeof FeedZ>;

// Paginated feed shape (back-compatible: existing non-paginated array still supported via service adapter)
export const FeedPageZ = z.object({
  items: z.array(FeedItemZ),
  nextCursor: z.string().nullable(), // null => end of feed
});
export type FeedPage = z.infer<typeof FeedPageZ>;

// Note: we deliberately avoid the bare name User to prevent collisions with Drizzle User.
