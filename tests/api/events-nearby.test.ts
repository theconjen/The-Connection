import { beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { createServer } from 'http';

import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';

const baseEvent = {
  description: 'Test event',
  location: 'Somewhere',
  eventDate: new Date(),
  startTime: '10:00',
  endTime: '11:00',
  isPublic: true,
  showOnMap: true,
  creatorId: 1,
};

describe('GET /api/events/nearby', () => {
  let app: express.Express;

  beforeEach(async () => {
    const mem = storage as any;
    mem.data.events = [];
    mem.nextId = 1;

    app = express();
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));

    const httpServer = createServer(app);
    await registerRoutes(app, httpServer);
  });

  it('returns 400 when latitude or longitude are missing or invalid', async () => {
    const missingRes = await request(app)
      .get('/api/events/nearby')
      .expect(400);

    expect(missingRes.body.message).toContain('latitude and longitude');

    const invalidRes = await request(app)
      .get('/api/events/nearby?latitude=abc&longitude=123')
      .expect(400);

    expect(invalidRes.body.message).toContain('latitude and longitude');
  });

  it('returns events within the requested radius', async () => {
    const mem = storage as any;
    mem.data.events.push(
      { id: 1, title: 'San Francisco Meetup', latitude: '37.7749', longitude: '-122.4194', ...baseEvent },
      { id: 2, title: 'Los Angeles Gathering', latitude: '34.0522', longitude: '-118.2437', ...baseEvent },
      { id: 3, title: 'Invalid Coords', latitude: null, longitude: null, ...baseEvent },
    );

    const res = await request(app)
      .get('/api/events/nearby?latitude=37.7749&longitude=-122.4194&radius=50')
      .expect(200);

    const titles = res.body.map((event: any) => event.title);
    expect(titles).toContain('San Francisco Meetup');
    expect(titles).not.toContain('Los Angeles Gathering');
    expect(titles).not.toContain('Invalid Coords');
  });
});
