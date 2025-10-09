import { http } from '../http';
import { FeedZ, type Feed } from '../app-schema';

export async function getFeed(): Promise<Feed> {
  return FeedZ.parse(await http('/api/feed'));
}
