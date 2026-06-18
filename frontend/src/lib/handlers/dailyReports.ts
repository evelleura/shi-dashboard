import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * Laporan Harian (Catatan Kendala) - sesuai naskah 4.2.2: teknisi mencatat
 * kendala lapangan harian. KEPUTUSAN PROYEK: TANPA persentase progres manual
 * (user menolak self-report %; EV tetap diturunkan dari status tugas oleh
 * spiCalculator). Jadi handler ini hanya menyimpan `constraints` (catatan
 * kendala) + tanggal; `daily_reports.progress_percentage` dibiarkan NULL.
 *
 * Upsert per (project_id, report_date, created_by): satu catatan per teknisi
 * per proyek per hari, bisa disunting ulang di hari yang sama.
 */

export async function createDailyReport(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const body = await request.json();
  const projectId = parseInt(String(body.project_id));
  const constraints = typeof body.constraints === 'string' ? body.constraints.trim() : '';
  const reportDate = body.report_date ? String(body.report_date) : null;

  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'project_id wajib diisi' }, { status: 400 });
  }
  if (!constraints) {
    return NextResponse.json({ success: false, error: 'Catatan kendala tidak boleh kosong' }, { status: 400 });
  }

  try {
    const proj = await query('SELECT id_proyek FROM tb_proyek WHERE id_proyek = $1', [projectId]);
    if (proj.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    // Teknisi hanya boleh melapor pada proyek yang ditugaskan padanya.
    if (auth.user.role === 'teknisi') {
      const assigned = await query(
        'SELECT 1 FROM tb_penugasan_proyek WHERE id_proyek = $1 AND id_user = $2',
        [projectId, auth.user.userId]
      );
      if (assigned.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Anda tidak ditugaskan pada proyek ini' }, { status: 403 });
      }
    }

    const result = await query(
      `INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), NULL, $3, $4)
       ON CONFLICT (project_id, report_date, created_by)
       DO UPDATE SET constraints = EXCLUDED.constraints
       RETURNING id, project_id, report_date, constraints, created_by, created_at`,
      [projectId, reportDate, constraints, auth.user.userId]
    );
    const author = await query<{ name: string }>('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId]);
    return NextResponse.json(
      { success: true, data: { ...result.rows[0], created_by_name: author.rows[0]?.name ?? null } },
      { status: 201 }
    );
  } catch (err) {
    console.error('Create daily report error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function listByProject(request: NextRequest, projectId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(projectId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'ID proyek tidak valid' }, { status: 400 });

  try {
    const result = await query(
      `SELECT dr.id, dr.project_id, dr.report_date, dr.constraints,
              dr.created_by, u.nama AS created_by_name, dr.created_at
       FROM daily_reports dr
       JOIN tb_user u ON u.id_user = dr.created_by
       WHERE dr.project_id = $1 AND dr.constraints IS NOT NULL
       ORDER BY dr.report_date DESC, dr.created_at DESC`,
      [id]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List daily reports error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
