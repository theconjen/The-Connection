import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import { registerRoutes } from './routes';

// Lightweight in-memory session (no PG) for test harness
const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));

// Immediately register routes without running migrations / email setup
// We rely on shared FEATURES (already FEED:true). If ever dynamic, could force here.
let ready = false;
const httpServer = createServer(app);

(async () => {
  try {
    await registerRoutes(app, httpServer);
    ready = true;
  } catch (e) {
    console.error('Failed to register routes in test-app:', e);
  }
})();

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
