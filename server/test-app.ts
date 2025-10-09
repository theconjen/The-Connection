import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import feedRoutes from './routes/feed';

// Lightweight in-memory session (no PG) for test harness
const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));

// Immediately register only the minimal routes needed for API tests
// Avoid importing the full server/routes.ts to keep test dependencies light
let ready = false;
const httpServer = createServer(app);

try {
  // Mount just the feed routes under /api
  app.use('/api', feedRoutes);
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
