// PATCH /api/tasks/[id] — ubah status tugas.
//   - Teknisi: to_do -> working_on (boleh).
//   - Manajer: -> done (Review Gate).
// DELETE /api/tasks/[id] — manajer.
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';
import { rekalkulasiKesehatan } from '@/lib/health-recompute';

const STATUS_VALID = ['to_do', 'working_on', 'done'] as const;
type StatusTugas = (typeof STATUS_VALID)[number];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  const { id } = await ctx.params;
  const idTugas = Number(id);
  if (!Number.isFinite(idTugas)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? '') as StatusTugas;
  if (!STATUS_VALID.includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
  }

  const cur = await query<{ id_user: number | null; id_proyek: number; status: StatusTugas }>(
    'SELECT id_user, id_proyek, status FROM tb_tugas WHERE id_tugas = $1',
    [idTugas],
  );
  if (cur.rows.length === 0) {
    return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
  }
  const t = cur.rows[0];

  // Otorisasi peran.
  if (u.role === 'technician') {
    if (t.id_user !== u.id) {
      return NextResponse.json({ error: 'Tugas bukan milik Anda' }, { status: 403 });
    }
    if (status === 'done') {
      return NextResponse.json(
        { error: 'Teknisi tidak boleh menandai selesai — menunggu persetujuan manajer' },
        { status: 403 },
      );
    }
  }
  // Manajer boleh semua transisi.

  await query(
    'UPDATE tb_tugas SET status = $1, updated_at = NOW() WHERE id_tugas = $2',
    [status, idTugas],
  );
  await rekalkulasiKesehatan(t.id_proyek);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (u.role !== 'manager') {
    return NextResponse.json({ error: 'Hanya manajer yang boleh menghapus' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const idTugas = Number(id);
  if (!Number.isFinite(idTugas)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const r = await query<{ id_proyek: number }>(
    'DELETE FROM tb_tugas WHERE id_tugas = $1 RETURNING id_proyek',
    [idTugas],
  );
  if (r.rows.length > 0) await rekalkulasiKesehatan(r.rows[0].id_proyek);
  return NextResponse.json({ ok: true });
}
