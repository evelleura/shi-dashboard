// Setup global untuk test (vitest).
process.env.JWT_SECRET ||= 'test-secret-shi';
// NODE_ENV adalah readonly di type Next.js — pakai bracket access.
(process.env as Record<string, string>).NODE_ENV ||= 'test';
