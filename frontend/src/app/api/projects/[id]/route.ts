// GET /api/projects/[id] — detail proyek + tugas + bukti + eskalasi.
// PATCH /api/projects/[id] — perbarui (manajer) — termasuk persetujuan survei.
// DELETE /api/projects/[id] — manajer.
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  const { id } = await ctx.params;
  const idProyek = Number(id);
  if (!Number.isFinite(idProyek)) {
    return NextResponse.json({ error: 'ID proyek tidak valid' }, { status: 400 });
  }
  const proyek = await query(
    `SELECT p.*, c.nama_klien,
            ph.spi_value, ph.status AS health_status,
            ph.actual_progress, ph.planned_progress,
            ph.total_tasks, ph.completed_tasks,
            ph.working_tasks, ph.overdue_tasks
       FROM tb_proyek p
       LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
       LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
      WHERE p.id_proyek = $1`,
    [idProyek],
  );
  if (proyek.rows.length === 0) {
    return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
  }
  const tugas = await query(
    `SELECT t.*, u.nama AS nama_teknisi
       FROM tb_tugas t LEFT JOIN tb_user u ON u.id_user = t.id_user
      WHERE t.id_proyek = $1
      ORDER BY t.sort_order, t.id_tugas`,
    [idProyek],
  );
  const teknisi = await query(
    `SELECT u.id_user, u.nama, u.email
       FROM tb_penugasan_proyek pp
       JOIN tb_user u ON u.id_user = pp.id_user
      WHERE pp.id_proyek = $1`,
    [idProyek],
  );
  return NextResponse.json({ project: proyek.rows[0], tasks: tugas.rows, technicians: teknisi.rows });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (u.role !== 'manager') {
    return NextResponse.json({ error: 'Hanya manajer yang dapat memperbarui' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const idProyek = Number(id);
  if (!Number.isFinite(idProyek)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const body = await req.json().catch(() => ({}));

  // Approve survey: phase 'survey' -> 'execution'.
  if (body.approveSurvey === true) {
    await query(
      `UPDATE tb_proyek SET phase = 'execution', survey_approved = TRUE, updated_at = NOW()
        WHERE id_proyek = $1`,
      [idProyek],
    );
    return NextResponse.json({ ok: true });
  }

  // Pembaruan umum (nama / tanggal / status).
  const fields: string[] = [];
  const values: unknown[] = [];
  const setField = (col: string, val: unknown) => {
    fields.push(`${col} = $${fields.length + 1}`);
    values.push(val);
  };
  if (typeof body.nama_proyek === 'string') setField('nama_proyek', body.nama_proyek.trim());
  if (typeof body.status === 'string' && ['active','completed','on-hold'].includes(body.status)) {
    setField('status', body.status);
  }
  if (typeof body.start_date === 'string') setField('start_date', body.start_date);
  if (typeof body.end_date === 'string') setField('end_date', body.end_date);
  if (fields.length === 0) return NextResponse.json({ ok: true, unchanged: true });
  values.push(idProyek);
  await query(
    `UPDATE tb_proyek SET ${fields.join(', ')}, updated_at = NOW() WHERE id_proyek = $${values.length}`,
    values,
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (u.role !== 'manager') {
    return NextResponse.json({ error: 'Hanya manajer yang dapat menghapus' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const idProyek = Number(id);
  if (!Number.isFinite(idProyek)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  await query('DELETE FROM tb_proyek WHERE id_proyek = $1', [idProyek]);
  return NextResponse.json({ ok: true });
}
