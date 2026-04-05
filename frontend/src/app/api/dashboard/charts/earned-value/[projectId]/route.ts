import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { calculatePlannedValue } from '@/lib/spiCalculator';

// GET /api/dashboard/charts/earned-value/:projectId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId: projectIdStr } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const projectId = parseInt(projectIdStr);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const projectResult = await query<{ start_date: Date; end_date: Date; status: string }>(
      'SELECT start_date, end_date, status FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const project = projectResult.rows[0];
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const today = new Date();

    const totalTasksResult = await query<{ total: string }>(
      'SELECT COUNT(*)::int AS total FROM tasks WHERE project_id = $1',
      [projectId]
    );
    const totalTasks = parseInt(String(totalTasksResult.rows[0].total)) || 0;

    const timeline: Array<{ date: string; pv: number; ev: number; spi: number }> = [];
    const dataEnd = today < endDate ? today : endDate;

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    let current = new Date(startDate);

    while (current <= dataEnd) {
      const pv = calculatePlannedValue(startDate, endDate, current);

      let ev: number;
      if (totalTasks === 0) {
        const reportResult = await query<{ progress_percentage: string }>(
          `SELECT progress_percentage FROM daily_reports
           WHERE project_id = $1 AND report_date <= $2
           ORDER BY report_date DESC, created_at DESC
           LIMIT 1`,
          [projectId, current.toISOString().split('T')[0]]
        );
        ev = reportResult.rowCount && reportResult.rowCount > 0
          ? parseFloat(reportResult.rows[0].progress_percentage)
          : 0;
      } else {
        const completedResult = await query<{ completed: string }>(
          `SELECT COUNT(*) FILTER (WHERE status = 'done' AND updated_at <= $2)::int AS completed
           FROM tasks WHERE project_id = $1`,
          [projectId, current.toISOString()]
        );
        const completed = parseInt(String(completedResult.rows[0].completed)) || 0;
        ev = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
      }

      const spi = pv > 0 ? Math.round((ev / pv) * 10000) / 10000 : 1;

      timeline.push({
        date: current.toISOString().split('T')[0],
        pv: Math.round(pv * 100) / 100,
        ev: Math.round(ev * 100) / 100,
        spi,
      });

      current = new Date(current.getTime() + msPerWeek);
    }

    // Include today as last point if not already
    if (timeline.length > 0) {
      const lastDate = timeline[timeline.length - 1].date;
      const todayStr = today.toISOString().split('T')[0];
      if (lastDate !== todayStr && today <= endDate) {
        const pv = calculatePlannedValue(startDate, endDate, today);
        let ev: number;
        if (totalTasks === 0) {
          const reportResult = await query<{ progress_percentage: string }>(
            `SELECT progress_percentage FROM daily_reports
             WHERE project_id = $1 AND report_date <= $2
             ORDER BY report_date DESC, created_at DESC
             LIMIT 1`,
            [projectId, todayStr]
          );
          ev = reportResult.rowCount && reportResult.rowCount > 0
            ? parseFloat(reportResult.rows[0].progress_percentage)
            : 0;
        } else {
          const completedResult = await query<{ completed: string }>(
            `SELECT COUNT(*) FILTER (WHERE status = 'done')::int AS completed
             FROM tasks WHERE project_id = $1`,
            [projectId]
          );
          const completed = parseInt(String(completedResult.rows[0].completed)) || 0;
          ev = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
        }
        const spi = pv > 0 ? Math.round((ev / pv) * 10000) / 10000 : 1;
        timeline.push({
          date: todayStr,
          pv: Math.round(pv * 100) / 100,
          ev: Math.round(ev * 100) / 100,
          spi,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        total_tasks: totalTasks,
        timeline,
      },
    });
  } catch (err) {
    console.error('Earned value chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
