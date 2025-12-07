import { describe, it, expect, afterEach, vi } from 'vitest';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { AddressInfo } from 'net';
import { registerSocketHandlers } from '../../server/routes';

const createTestServer = async (deps: Parameters<typeof registerSocketHandlers>[1]) => {
  const app = express();
  const httpServer = createServer(app);
  const ioServer = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  registerSocketHandlers(ioServer, deps);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;

  return { httpServer, ioServer, port };
};

const createMockDeps = () => {
  const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };
  const storage = {
    createChatMessage: vi.fn(),
    getUser: vi.fn().mockResolvedValue({ id: 1, username: 'tester' }),
    createDirectMessage: vi.fn(),
    getUserPushTokens: vi.fn().mockResolvedValue([]),
  };

  return {
    storage,
    sendPushNotification: vi.fn(),
    logger,
  };
};

describe('socket error handling', () => {
  let activeClient: ReturnType<typeof Client> | null = null;
  let activeHttpServer: ReturnType<typeof createServer> | null = null;
  let activeIoServer: SocketIOServer | null = null;

  afterEach(async () => {
    activeClient?.close();
    activeIoServer?.close();
    await new Promise((resolve) => (activeHttpServer ? activeHttpServer.close(resolve) : resolve(null)));
    activeClient = null;
    activeIoServer = null;
    activeHttpServer = null;
    vi.restoreAllMocks();
  });

  it('emits an error when joining a different user room', async () => {
    const deps = createMockDeps();
    const { httpServer, ioServer, port } = await createTestServer(deps);
    activeHttpServer = httpServer;
    activeIoServer = ioServer;

    const client = Client(`http://localhost:${port}`, {
      auth: { userId: '1' },
      transports: ['websocket'],
    });
    activeClient = client;

    const errorPromise = new Promise<any>((resolve) => client.on('error', resolve));
    await new Promise((resolve) => client.on('connect', resolve));

    client.emit('join_user_room', '2');
    const error = await errorPromise;

    expect(error.message).toContain('Unauthorized');
  });

  it('emits an error when message persistence fails', async () => {
    const deps = createMockDeps();
    deps.storage.createChatMessage.mockRejectedValue(new Error('db down'));

    const { httpServer, ioServer, port } = await createTestServer(deps);
    activeHttpServer = httpServer;
    activeIoServer = ioServer;

    const client = Client(`http://localhost:${port}`, {
      auth: { userId: '3' },
      transports: ['websocket'],
    });
    activeClient = client;

    const errorPromise = new Promise<any>((resolve) => client.on('error', resolve));
    await new Promise((resolve) => client.on('connect', resolve));

    client.emit('new_message', { roomId: '5', content: 'hello', senderId: '3' });
    const error = await errorPromise;

    expect(error.message).toContain('Failed to send message');
  });
});
