import '@testing-library/jest-dom';
import { vi, afterAll } from 'vitest';

// Set test env vars before any module loads
process.env.DB_NAME = 'shi_test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '5433';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.JWT_SECRET = 'SecretDian';


// Mock next/headers for server components
vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({ get: () => null }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Global cleanup after all tests
afterAll(async () => {
  // Give time for pg pool to drain
  await new Promise(resolve => setTimeout(resolve, 100));
});
