/**
 * Eksekutor tindakan eskalasi.
 *
 * Saat manajer MENYETUJUI permintaan tindakan pada sebuah eskalasi, tindakan itu
 * dieksekusi NYATA (bukan sekadar ubah status). Dijalankan di dalam SATU transaksi
 * (lihat respondActionRequest -> withTransaction) supaya cascade atomik: gagal di
 * tengah = ROLLBACK, tak ada perubahan parsial.
 *
 * Dua tingkat (selaras PRD docs/prd):
 *   - EKSEKUTIF (ubah state + cascade): ganti_teknisi, perpanjang_deadline, batalkan_eskalasi.
 *   - TERCATAT  (log + notifikasi, tak ada entitas utk dimutasi): ganti_alat, mediasi_client.
 *
 * Efek-ikutan non-transaksional (rekalkulasi SPI, notifikasi, audit) ditangani
 * pemanggil PASCA-commit memakai `ActionResult` yang dikembalikan di sini.
 */
import { PoolClient } from 'pg';
import { findConflicts } from './tasks';

// Error tindakan = validasi gagal (input manajer salah / bentrok jadwal). Pemanggil
// menerjemahkannya jadi HTTP 409, bukan 500. Membuat tx ROLLBACK saat dilempar.
export class ActionError extends Error {}

export interface ActionParams {
  new_technician_id?: number;
  reassign_scope?: 'task' | 'all';
  new_due_date?: string;       // 'YYYY-MM-DD'
  extra_days?: number;
  cascade_project_end?: boolean;
}

export interface EscalationRow {
  id: number;
  task_id: number;
  project_id: number;
  reported_by: number;
  action_request: string;
}

export type ActionResult =
  | { kind: 'ganti_teknisi'; oldTechId: number | null; newTechId: number; taskIds: number[]; projectId: number }
  | { kind: 'perpanjang_deadline'; taskId: number; projectId: number; newDue: string | null; projectEndChanged: boolean }
  | { kind: 'recorded'; action: string; projectId: number }
  | { kind: 'none' };

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

/**
 * Eksekusi tindakan yang DISETUJUI di dalam transaksi `client`. Murni mutasi DB
 * inti + validasi; mengembalikan ringkasan utk efek-ikutan pasca-commit.
 */
export async function executeEscalationAction(
  client: PoolClient,
  esc: EscalationRow,
  params: ActionParams,
): Promise<ActionResult> {
  switch (esc.action_request) {
    case 'ganti_teknisi':
      return execGantiTeknisi(client, esc, params);
    case 'perpanjang_deadline':
      return execPerpanjangDeadline(client, esc, params);
    case 'ganti_alat':
    case 'mediasi_client':
      // Tercatat: tak ada entitas alat / komunikasi-klien (naskah buang materials).
      // Cukup jejak + notifikasi (ditangani pemanggil); tidak ada mutasi DB inti.
      return { kind: 'recorded', action: esc.action_request, projectId: esc.project_id };
    case 'batalkan_eskalasi':
      // Penutupan eskalasi ditangani pemanggil (status='closed'); tak ada cascade.
      return { kind: 'none' };
    default:
      return { kind: 'none' };
  }
}

// ── ganti_teknisi: reassign tugas X->Y + sinkron penugasan proyek + cek bentrok ──
async function execGantiTeknisi(
  client: PoolClient,
  esc: EscalationRow,
  params: ActionParams,
): Promise<ActionResult> {
  const Y = params.new_technician_id;
  if (!Y || !Number.isInteger(Y)) {
    throw new ActionError('Teknisi pengganti (new_technician_id) wajib dipilih untuk tindakan ganti teknisi.');
  }

  const yres = await client.query<{ role: string; is_active: boolean }>(
    'SELECT role, is_active FROM tb_user WHERE id_user = $1', [Y],
  );
  if (yres.rowCount === 0) throw new ActionError('Teknisi pengganti tidak ditemukan.');
  if (!yres.rows[0].is_active) throw new ActionError('Teknisi pengganti sedang non-aktif.');
  if (yres.rows[0].role !== 'teknisi') throw new ActionError('Pengganti harus berperan teknisi.');

  // Teknisi lama (X) = pemegang tugas yang dieskalasi saat ini.
  const tres = await client.query<{ assigned_to: number | null }>(
    'SELECT assigned_to FROM tb_tugas WHERE id_tugas = $1', [esc.task_id],
  );
  const oldTechId = tres.rows[0]?.assigned_to ?? null;
  if (oldTechId === Y) throw new ActionError('Teknisi pengganti sama dengan teknisi yang sekarang.');

  // Himpunan tugas: hanya tugas eskalasi (default), atau semua tugas X belum-selesai di proyek.
  let taskIds: number[];
  if (params.reassign_scope === 'all' && oldTechId) {
    const all = await client.query<{ id_tugas: number }>(
      `SELECT id_tugas FROM tb_tugas WHERE id_proyek = $1 AND assigned_to = $2 AND status <> 'done'`,
      [esc.project_id, oldTechId],
    );
    taskIds = all.rows.map((r) => r.id_tugas);
    if (!taskIds.includes(esc.task_id)) taskIds.push(esc.task_id);
  } else {
    taskIds = [esc.task_id];
  }

  // Cek bentrok jadwal Y per tugas (pakai cek double-booking yang sama dgn tasks).
  for (const id of taskIds) {
    const t = await client.query<{ timeline_start: Date | null; timeline_end: Date | null }>(
      'SELECT timeline_start, timeline_end FROM tb_tugas WHERE id_tugas = $1', [id],
    );
    const r = t.rows[0];
    if (r?.timeline_start && r?.timeline_end) {
      const conflicts = await findConflicts(Y, toDateStr(r.timeline_start), toDateStr(r.timeline_end), id);
      if (conflicts.length > 0) {
        const names = conflicts.map((c) => c.name as string).join(', ');
        throw new ActionError(`Teknisi pengganti sudah punya tugas yang bentrok jadwal: ${names}`);
      }
    }
  }

  await client.query(
    'UPDATE tb_tugas SET assigned_to = $1, updated_at = NOW() WHERE id_tugas = ANY($2::int[])',
    [Y, taskIds],
  );
  await client.query(
    'INSERT INTO tb_penugasan_proyek (id_proyek, id_user) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [esc.project_id, Y],
  );

  return { kind: 'ganti_teknisi', oldTechId, newTechId: Y, taskIds, projectId: esc.project_id };
}

// ── perpanjang_deadline: geser due_date tugas (+ opsional end_date proyek) ──
async function execPerpanjangDeadline(
  client: PoolClient,
  esc: EscalationRow,
  params: ActionParams,
): Promise<ActionResult> {
  let row: { due_date: Date | null } | undefined;
  if (params.new_due_date) {
    row = (await client.query<{ due_date: Date | null }>(
      'UPDATE tb_tugas SET due_date = $1::date, updated_at = NOW() WHERE id_tugas = $2 RETURNING due_date',
      [params.new_due_date, esc.task_id],
    )).rows[0];
  } else if (params.extra_days && Number.isInteger(params.extra_days) && params.extra_days > 0) {
    row = (await client.query<{ due_date: Date | null }>(
      `UPDATE tb_tugas
         SET due_date = (COALESCE(due_date, timeline_end, CURRENT_DATE) + ($1 * INTERVAL '1 day'))::date,
             updated_at = NOW()
       WHERE id_tugas = $2 RETURNING due_date`,
      [params.extra_days, esc.task_id],
    )).rows[0];
  } else {
    throw new ActionError('Isi tanggal baru (new_due_date) atau jumlah hari (extra_days > 0) untuk perpanjang deadline.');
  }

  const newDue = row?.due_date ? toDateStr(row.due_date) : null;
  let projectEndChanged = false;
  if (params.cascade_project_end && newDue) {
    const pr = await client.query(
      'UPDATE tb_proyek SET end_date = $1::date, updated_at = NOW() WHERE id_proyek = $2 AND $1::date > end_date RETURNING id_proyek',
      [newDue, esc.project_id],
    );
    projectEndChanged = (pr.rowCount ?? 0) > 0;
  }

  return { kind: 'perpanjang_deadline', taskId: esc.task_id, projectId: esc.project_id, newDue, projectEndChanged };
}
