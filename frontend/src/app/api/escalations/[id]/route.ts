// PATCH /api/escalations/[id] — manajer mengirim instruksi / menutup eskalasi.
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (u.role !== 'manager') {
    return NextResponse.json({ error: 'Hanya manajer yang dapat menangani eskalasi' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const idEsk = Number(id);
  if (!Number.isFinite(idEsk)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const instruksi = body.instruksi ? String(body.instruksi).trim() : null;
  const tutup = body.tutup === true;
  const status = tutup ? 'closed' : 'ditangani';
  const r = await query(
    `UPDATE tb_eskalasi
        SET instruksi   = COALESCE($1, instruksi),
            status      = $2::varchar,
            resolved_at = CASE WHEN $2::varchar = 'closed' THEN NOW() ELSE resolved_at END
      WHERE id_eskalasi = $3`,
    [instruksi, status, idEsk],
  );
  if (r.rowCount === 0) return NextResponse.json({ error: 'Eskalasi tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
