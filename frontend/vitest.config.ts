import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts'],
    env: {
      DB_HOST: '127.0.0.1',
      DB_PORT: '5433',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_NAME: 'shi_test',
      JWT_SECRET: 'test-secret-shi',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts'],
      exclude: ['**/__tests__/**', 'src/test/**'],
    },
  },
});
