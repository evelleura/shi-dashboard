// GET /api/projects — daftar proyek (manajer: semua, teknisi: yang ditugaskan).
// POST /api/projects — manajer membuat proyek baru.
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';

export async function GET() {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  const sql = `
    SELECT p.id_proyek, p.nama_proyek, p.start_date, p.end_date,
           p.status, p.phase, p.project_code, p.category, p.project_value,
           c.nama_klien,
           ph.spi_value, ph.status AS health_status,
           ph.actual_progress, ph.planned_progress,
           ph.total_tasks, ph.completed_tasks
    FROM tb_proyek p
    LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
    LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
    ${u.role === 'technician' ? `
      WHERE p.id_proyek IN (
        SELECT id_proyek FROM tb_penugasan_proyek WHERE id_user = $1
      )
    ` : ''}
    ORDER BY p.created_at DESC
  `;
  const params = u.role === 'technician' ? [u.id] : [];
  const r = await query(sql, params);
  return NextResponse.json({ projects: r.rows });
}

export async function POST(req: Request) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (u.role !== 'manager') {
    return NextResponse.json({ error: 'Hanya manajer yang dapat membuat proyek' }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Format tidak valid' }, { status: 400 });
  }
  const nama = String(body.nama_proyek ?? '').trim();
  const idKlien = body.id_klien ? Number(body.id_klien) : null;
  const start = String(body.start_date ?? '').trim();
  const end = String(body.end_date ?? '').trim();
  const phase = String(body.phase ?? 'survey');
  const category = body.category ? String(body.category) : null;
  const description = body.description ? String(body.description) : null;
  const projectValue = body.project_value ? Number(body.project_value) : 0;

  if (!nama) return NextResponse.json({ error: 'Nama proyek wajib diisi' }, { status: 400 });
  if (!start || !end) return NextResponse.json({ error: 'Tanggal mulai & akhir wajib diisi' }, { status: 400 });
  if (new Date(end) < new Date(start)) {
    return NextResponse.json({ error: 'Tanggal akhir harus setelah tanggal mulai' }, { status: 400 });
  }
  if (!['survey', 'execution'].includes(phase)) {
    return NextResponse.json({ error: 'Fase tidak valid' }, { status: 400 });
  }

  const code = `PRJ-${Date.now().toString().slice(-6)}`;
  const r = await query<{ id_proyek: string | number }>(
    `INSERT INTO tb_proyek
       (nama_proyek, id_klien, start_date, end_date, status, phase, id_user,
        project_code, description, category, project_value, created_by)
     VALUES ($1,$2,$3,$4,'active',$5,$6,$7,$8,$9,$10,$11)
     RETURNING id_proyek`,
    [nama, idKlien, start, end, phase, u.id, code, description, category, projectValue, u.id],
  );
  return NextResponse.json({ ok: true, id_proyek: Number(r.rows[0].id_proyek) }, { status: 201 });
}
