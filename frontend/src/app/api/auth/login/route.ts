// POST /api/auth/login — validasi kredensial & terbitkan sesi.
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken, verifyPassword } from '@/lib/auth';
import { setSesi } from '@/lib/session';

interface BarisUser {
  id_user: number;
  nama: string;
  email: string;
  password: string;
  role: 'manager' | 'technician';
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Format permintaan tidak valid' }, { status: 400 });
  }
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan kata sandi wajib diisi' }, { status: 400 });
  }
  const r = await query<BarisUser>(
    'SELECT id_user, nama, email, password, role FROM tb_user WHERE email = $1 LIMIT 1',
    [email],
  );
  if (r.rows.length === 0) {
    return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 401 });
  }
  const u = r.rows[0];
  const cocok = await verifyPassword(password, u.password);
  if (!cocok) {
    return NextResponse.json({ error: 'Kata sandi salah' }, { status: 401 });
  }
  const token = signToken({ id: u.id_user, email: u.email, nama: u.nama, role: u.role });
  await setSesi(token);
  return NextResponse.json({
    ok: true,
    user: { id: u.id_user, nama: u.nama, email: u.email, role: u.role },
  });
}
