import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin workspace root ke folder ini — mencegah Next.js mendeteksi
  // package-lock.json acak di /Users/user/ sebagai root yang salah.
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};
export default nextConfig;
