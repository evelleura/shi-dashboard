// GET /api/dashboard — data ringkasan untuk Dashboard EWS / Performa Teknisi.
// Kueri ringkasan + daftar proyek aktif terurut RAG (Gambar 5.11, 5.12, 5.21).
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';

export async function GET() {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });

  if (u.role === 'manager') {
    const ringkas = await query(`
      SELECT
        COUNT(*) FILTER (WHERE p.status = 'active')::int                                   AS proyek_aktif,
        COUNT(*) FILTER (WHERE ph.status = 'red'   AND p.status = 'active')::int           AS kritis,
        COUNT(*) FILTER (WHERE ph.status = 'amber' AND p.status = 'active')::int           AS waspada,
        COUNT(*) FILTER (WHERE ph.status = 'green' AND p.status = 'active')::int           AS tepat_waktu,
        COUNT(*) FILTER (WHERE ph.status IS NULL AND p.status = 'active')::int             AS tanpa_data,
        COALESCE(ROUND(AVG(ph.spi_value) FILTER (WHERE p.status='active'), 4), 0) AS rata_rata_spi
      FROM tb_proyek p
      LEFT JOIN project_health ph ON ph.project_id = p.id_proyek`);
    const proyek = await query(`
      SELECT p.id_proyek, p.nama_proyek, p.end_date, c.nama_klien,
             ph.spi_value, ph.status AS rag,
             ph.completed_tasks, ph.total_tasks, ph.overdue_tasks, ph.overtime_tasks,
             ph.actual_progress, ph.planned_progress
        FROM tb_proyek p
        LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
        LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
       WHERE p.status = 'active'
       ORDER BY
         CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
         ph.spi_value ASC NULLS LAST,
         p.end_date ASC`);
    const tugasStat = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'to_do')::int       AS belum_mulai,
        COUNT(*) FILTER (WHERE status = 'working_on')::int  AS dikerjakan,
        COUNT(*) FILTER (WHERE status = 'done')::int        AS selesai
      FROM tb_tugas`);
    return NextResponse.json({
      role: 'manager',
      ringkasan: ringkas.rows[0],
      tugas: tugasStat.rows[0],
      proyek: proyek.rows,
    });
  }

  // Teknisi: dasbor performa.
  const perf = await query(
    `SELECT
        COUNT(*)::int                                                 AS total_tugas,
        COUNT(*) FILTER (WHERE status = 'done')::int                  AS selesai,
        COUNT(*) FILTER (WHERE status = 'working_on')::int            AS dikerjakan,
        COUNT(*) FILTER (WHERE status = 'to_do')::int                 AS belum_mulai,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status <> 'done')::int AS terlambat
       FROM tb_tugas WHERE id_user = $1`,
    [u.id],
  );
  const tugas = await query(
    `SELECT t.*, p.nama_proyek
       FROM tb_tugas t JOIN tb_proyek p ON p.id_proyek = t.id_proyek
      WHERE t.id_user = $1
      ORDER BY t.due_date NULLS LAST`,
    [u.id],
  );
  return NextResponse.json({ role: 'technician', ringkasan: perf.rows[0], tugas: tugas.rows });
}
