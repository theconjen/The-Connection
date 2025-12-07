import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import createFeedRouter from './routes/createFeedRouter';
import { MemStorage } from './storage';
import { setSessionUserId } from './utils/session';
import { createPostsRouter } from './routes/posts';
import { createMicroblogsRouter } from './routes/microblogs';

// Lightweight in-memory session (no PG) for test harness
const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));

// Allow tests to set the authenticated user via header for requireAuth middleware
app.use((req, _res, next) => {
  const headerUserId = req.headers['x-test-user-id'];
  if (headerUserId) {
    try {
      setSessionUserId(req as any, headerUserId as any);
    } catch (err) {
      console.error('Failed to set session user id for tests', err);
    }
  }
  next();
});

// Immediately register only the minimal routes needed for API tests
// Avoid importing the full server/routes.ts to keep test dependencies light
let ready = false;
const httpServer = createServer(app);

// Create a shared MemStorage instance for tests to manipulate directly.
export const testMemStorage = new MemStorage();

try {
  // Mount just the feed routes under /api using the test MemStorage
  app.use('/api', createFeedRouter(testMemStorage));
  app.use('/api', createPostsRouter(testMemStorage as any));
  app.use('/api', createMicroblogsRouter(testMemStorage as any));
  ready = true;
} catch (e) {
  console.error('Failed to register minimal routes in test-app:', e);
}

// Middleware to wait until routes are registered (cheap spin wait for early test requests)
app.use((req, res, next) => {
  if (ready) return next();
  const start = Date.now();
  const check = () => {
    if (ready) return next();
    if (Date.now() - start > 5000) {
      return res.status(503).json({ message: 'Test app not ready' });
    }
    setTimeout(check, 10);
  };
  check();
});

export default app;
