import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import express from 'express';
import http from 'http';

// In-memory store to verify persistence behaviour
const mockStorage: Record<string, string> = {};

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiBase: '' } } },
}));

vi.mock('../lib/secureStorage', () => ({
  saveAuthToken: vi.fn(async (token: string) => {
    if (token) mockStorage['auth_token'] = token;
    else delete mockStorage['auth_token'];
  }),
  getAuthToken: vi.fn(async () => mockStorage['auth_token'] ?? ''),
  saveSessionCookie: vi.fn(async (cookie: string) => {
    mockStorage['session_cookie'] = cookie;
  }),
  getSessionCookie: vi.fn(async () => mockStorage['session_cookie'] ?? null),
  removeSessionCookie: vi.fn(async () => {
    delete mockStorage['session_cookie'];
  }),
  clearAuthData: vi.fn(async () => {
    delete mockStorage['auth_token'];
    delete mockStorage['session_cookie'];
  }),
  saveUserData: vi.fn(async (data: unknown) => {
    mockStorage['user_data'] = JSON.stringify(data);
  }),
  getUserData: vi.fn(async () => {
    const value = mockStorage['user_data'];
    return value ? JSON.parse(value) : null;
  }),
}));

// Import after mocks
import apiClient, { authAPI } from '../lib/apiClient';
import { getSessionCookie } from '../lib/secureStorage';

describe('mobile auth session handling', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());

    app.post('/api/login', (_req, res) => {
      res.setHeader('Set-Cookie', 'sessionId=test-session; Path=/; HttpOnly');
      res.json({ id: 1, username: 'test-user' });
    });

    app.get('/api/user', (req, res) => {
      const cookieHeader = req.headers['cookie'];
      if (!cookieHeader || !cookieHeader.includes('sessionId=test-session')) {
        return res.status(401).json({ message: 'Missing session' });
      }
      res.json({ id: 1, username: 'test-user' });
    });

    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address?.port ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}/api`;

    // update apiClient base URL for the test
    apiClient.defaults.baseURL = baseUrl;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('stores login cookie and reuses it on subsequent requests', async () => {
    const loginResponse = await authAPI.login({ username: 'user', password: 'pw' });
    expect(loginResponse.username).toBe('test-user');

    const persistedCookie = await getSessionCookie();
    expect(persistedCookie).toContain('sessionId=test-session');

    const userResponse = await authAPI.getCurrentUser();
    expect(userResponse.username).toBe('test-user');
  });
});
