import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';
import { config as loadEnv } from 'dotenv';

const envFiles = ['.env.test', '.env.local', '.env'];

for (const file of envFiles) {
  const envPath = path.resolve(__dirname, file);
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath, override: true });
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'packages/shared/src'),
      '@shared/': path.resolve(__dirname, 'packages/shared/src') + '/',
    }
  },
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts', 'mobile-app/TheConnectionMobile/src/__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup/init-memory.ts'],
  },
});
