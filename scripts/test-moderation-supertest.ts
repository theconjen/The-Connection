import express from 'express';
import request from 'supertest';
import moderationRoutes from '../server/routes/moderation';
import safetyRoutes from '../server/routes/safety';
import adminRoutes from '../server/routes/admin';

async function run() {
  const app = express();
  app.use(express.json());
  app.use('/api', moderationRoutes as any);
  app.use('/api', safetyRoutes as any);
  app.use('/api/admin', adminRoutes as any);

  // Unauthenticated requests should return 401 for protected endpoints
  const postRes = await request(app)
    .post('/api/moderation/report')
    .send({ contentType: 'post', contentId: 1, reason: 'spam' })
    .redirects(1);

  console.log('POST /api/moderation/report (redirect to /api/reports) status:', postRes.status);

  const adminRes = await request(app)
    .get('/api/moderation/admin/reports')
    .redirects(1);

  console.log('GET /api/moderation/admin/reports (redirect to /api/admin/reports) status:', adminRes.status);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
