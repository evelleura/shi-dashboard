// GET /api/auth/me — info user sesi aktif.
import { NextResponse } from 'next/server';
import { getSesi } from '@/lib/session';

export async function GET() {
  const u = await getSesi();
  if (!u) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: u });
}
