// GET /api/escalations — daftar eskalasi (manajer: semua; teknisi: miliknya).
// POST /api/escalations — teknisi mengajukan eskalasi atas suatu tugas.
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';

export async function GET() {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  const sql = `
    SELECT e.*, t.nama_tugas, t.id_proyek, p.nama_proyek, us.nama AS nama_pelapor
      FROM tb_eskalasi e
      JOIN tb_tugas t ON t.id_tugas = e.id_tugas
      JOIN tb_proyek p ON p.id_proyek = t.id_proyek
      JOIN tb_user us ON us.id_user = e.id_user
     ${u.role === 'technician' ? 'WHERE e.id_user = $1' : ''}
     ORDER BY e.created_at DESC`;
  const r = await query(sql, u.role === 'technician' ? [u.id] : []);
  return NextResponse.json({ escalations: r.rows });
}

export async function POST(req: Request) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (u.role !== 'technician') {
    return NextResponse.json({ error: 'Hanya teknisi yang dapat mengajukan eskalasi' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const idTugas = Number(body.id_tugas);
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const priority = String(body.priority ?? 'medium');
  if (!Number.isFinite(idTugas)) {
    return NextResponse.json({ error: 'id_tugas wajib' }, { status: 400 });
  }
  if (!title || !description) {
    return NextResponse.json({ error: 'Judul dan deskripsi wajib diisi' }, { status: 400 });
  }
  if (!['low', 'medium', 'high'].includes(priority)) {
    return NextResponse.json({ error: 'Prioritas tidak valid' }, { status: 400 });
  }
  const cek = await query('SELECT 1 FROM tb_tugas WHERE id_tugas = $1', [idTugas]);
  if (cek.rows.length === 0) {
    return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
  }
  const r = await query<{ id_eskalasi: string | number }>(
    `INSERT INTO tb_eskalasi (id_tugas, id_user, title, description, priority, status)
     VALUES ($1,$2,$3,$4,$5,'open') RETURNING id_eskalasi`,
    [idTugas, u.id, title, description, priority],
  );
  return NextResponse.json({ ok: true, id_eskalasi: Number(r.rows[0].id_eskalasi) }, { status: 201 });
}
