// POST /api/auth/logout — hapus sesi cookie.
import { NextResponse } from 'next/server';
import { hapusSesi } from '@/lib/session';

export async function POST() {
  await hapusSesi();
  return NextResponse.json({ ok: true });
}
