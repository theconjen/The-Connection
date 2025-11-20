import createFeedRouter from './createFeedRouter';
import { storage as realStorage } from '../storage';

// Thin compatibility wrapper kept for imports that expect `./routes/feed`.
// The canonical implementation lives in `createFeedRouter` and the app
// mounts that directly. This file is a trivial adapter.
export default createFeedRouter(realStorage as any);
