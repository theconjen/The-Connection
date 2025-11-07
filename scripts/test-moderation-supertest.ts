import express from 'express';
import request from 'supertest';
import moderationRoutes from '../server/routes/moderation';

async function run() {
  const app = express();
  app.use(express.json());
  app.use('/api', moderationRoutes as any);

  // Unauthenticated requests should return 401 for protected endpoints
  const postRes = await request(app)
    .post('/api/moderation/report')
    .send({ contentType: 'post', contentId: 1, reason: 'spam' });

  console.log('POST /api/moderation/report status:', postRes.status);

  const adminRes = await request(app)
    .get('/api/moderation/admin/reports');

  console.log('GET /api/moderation/admin/reports status:', adminRes.status);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
