// POST /api/reports — teknisi kirim laporan harian (memicu rekalkulasi SPI).
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';
import { rekalkulasiKesehatan } from '@/lib/health-recompute';

export async function POST(req: Request) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const projectId = Number(body.project_id);
  const taskId = body.task_id ? Number(body.task_id) : null;
  const progres = Number(body.progress_percentage);
  const constraints = body.constraints ? String(body.constraints) : null;
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: 'project_id wajib diisi' }, { status: 400 });
  }
  if (!Number.isFinite(progres) || progres < 0 || progres > 100) {
    return NextResponse.json({ error: 'Persentase progres harus 0–100' }, { status: 400 });
  }
  await query(
    `INSERT INTO daily_reports (project_id, task_id, report_date, progress_percentage, constraints, created_by)
     VALUES ($1,$2,CURRENT_DATE,$3,$4,$5)
     ON CONFLICT (project_id, report_date, created_by) DO UPDATE
        SET progress_percentage = EXCLUDED.progress_percentage,
            constraints = EXCLUDED.constraints,
            task_id = EXCLUDED.task_id`,
    [projectId, taskId, progres, constraints, u.id],
  );
  await rekalkulasiKesehatan(projectId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
