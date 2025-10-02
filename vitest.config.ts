import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@shared/': path.resolve(__dirname, 'shared') + '/',
    }
  },
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
    globals: true,
    environment: 'node',
  },
});
