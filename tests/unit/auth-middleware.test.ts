import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { requireAuth } from '../../server/middleware/auth';
import pushTokensRouter from '../../server/routes/pushTokens';

const createSessionApp = () => {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
  return app;
};

describe('requireAuth middleware', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const app = createSessionApp();
    app.get('/protected', requireAuth, (_req, res) => res.json({ ok: true }));

    await request(app).get('/protected').expect(401);
  });

  it('allows requests with a session userId and hydrates currentUser', async () => {
    const app = createSessionApp();
    app.get(
      '/protected',
      (req, _res, next) => {
        req.session.userId = 42;
        req.session.username = 'tester';
        next();
      },
      requireAuth,
      (req, res) => {
        res.json({
          ok: true,
          userId: (req as any).currentUser?.id,
          username: (req as any).currentUser?.username,
        });
      }
    );

    const res = await request(app).get('/protected').expect(200);
    expect(res.body).toEqual({ ok: true, userId: 42, username: 'tester' });
  });
});

describe('router-level auth protection', () => {
  it('denies access to protected routers without authentication', async () => {
    const app = createSessionApp();
    app.use('/push', pushTokensRouter);

    await request(app).post('/push/register').send({ token: 'abc' }).expect(401);
  });
});
