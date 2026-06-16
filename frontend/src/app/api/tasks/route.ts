// GET /api/tasks — daftar tugas (filter: ?project=, ?mine=1 untuk teknisi).
// POST /api/tasks — manajer membuat tugas baru.
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';
import { rekalkulasiKesehatan } from '@/lib/health-recompute';

export async function GET(req: Request) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  const url = new URL(req.url);
  const projectId = url.searchParams.get('project');
  const mine = url.searchParams.get('mine') === '1' || u.role === 'technician';
  const where: string[] = [];
  const params: unknown[] = [];
  if (projectId) { params.push(Number(projectId)); where.push(`t.id_proyek = $${params.length}`); }
  if (mine) { params.push(u.id); where.push(`t.id_user = $${params.length}`); }
  const sql = `
    SELECT t.*, p.nama_proyek
      FROM tb_tugas t
      JOIN tb_proyek p ON p.id_proyek = t.id_proyek
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY t.due_date NULLS LAST, t.sort_order`;
  const r = await query(sql, params);
  return NextResponse.json({ tasks: r.rows });
}

export async function POST(req: Request) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (u.role !== 'manager') {
    return NextResponse.json({ error: 'Hanya manajer yang boleh membuat tugas' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const idProyek = Number(body.id_proyek);
  const namaTugas = String(body.nama_tugas ?? '').trim();
  const idUser = body.id_user ? Number(body.id_user) : null;
  const dueDate = body.due_date ? String(body.due_date) : null;
  if (!Number.isFinite(idProyek)) {
    return NextResponse.json({ error: 'id_proyek wajib' }, { status: 400 });
  }
  if (!namaTugas) {
    return NextResponse.json({ error: 'Nama tugas wajib diisi' }, { status: 400 });
  }
  const r = await query<{ id_tugas: string | number }>(
    `INSERT INTO tb_tugas (id_proyek, id_user, nama_tugas, due_date, status, created_by)
     VALUES ($1,$2,$3,$4,'to_do',$5) RETURNING id_tugas`,
    [idProyek, idUser, namaTugas, dueDate, u.id],
  );
  await rekalkulasiKesehatan(idProyek);
  return NextResponse.json({ ok: true, id_tugas: Number(r.rows[0].id_tugas) }, { status: 201 });
}
