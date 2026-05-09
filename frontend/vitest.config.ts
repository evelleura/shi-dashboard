import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    environmentOptions: {
      env: {
        DB_NAME: 'shi_test',
        DB_HOST: '127.0.0.1',
        DB_PORT: '5432',
        DB_USER: 'postgres',
        DB_PASSWORD: '12345',
        JWT_SECRET: 'SecretDian',
        NODE_ENV: 'test',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json', 'html'],
      reportsDirectory: './coverage/unit',
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.d.ts',
        '**/*.config.{ts,mjs,js}',
        'src/types/**',
        'src/test/**',
        'src/app/layout.tsx',
        'src/app/providers.tsx',
        'src/app/page.tsx',
        'src/app/login/**',
        'src/app/routes.ts',
        'src/components/charts/**',
        'next-env.d.ts',
        '.next/**',
        'public/**',
        'uploads/**',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
        autoUpdate: false,
      },
      all: true,
      clean: true,
    },
  },
});
