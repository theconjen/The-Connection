/**
 * Screens index - re-export native screens and screen-local components
 *
 * This file centralizes the screen exports so other code can import
 * `import { ForumsScreen, PostDetailScreen } from '@/screens'`.
 */

// Screens
export { ForumsScreen } from './ForumsScreen';
export { PostDetailScreen } from './PostDetailScreen';

// Components used by screens
export { PostCard } from './PostCard';
export type { Post } from './PostCard';

export { ChannelCard, AddChannelCard } from './ChannelCard';
export type { Channel } from './ChannelCard';

export { Comments, sampleComments } from './Comments';
export type { Comment } from './Comments';
