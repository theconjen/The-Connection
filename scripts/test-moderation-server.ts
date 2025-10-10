import express from 'express';
import moderationRoutes from '../server/routes/moderation';

const app = express();
app.use(express.json());
app.use('/api', moderationRoutes as any);

const port = 39999;
const server = app.listen(port, () => {
  console.log(`Test moderation server listening on http://localhost:${port}`);
});

// Keep process alive for a short time to allow manual curl checks
setTimeout(() => {
  server.close(() => process.exit(0));
}, 20000);
