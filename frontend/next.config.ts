import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // distDir bisa dioverride lewat env NEXT_DIST_DIR. Dipakai stack terisolasi
  // (run.py --iso) supaya memakai folder build .next-iso dan TIDAK bentrok dengan
  // dev server utama yang memakai .next. Default tetap '.next'.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
