import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/dashboard - Main dashboard data (manager/admin)
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  try {
    const projectsResult = await query(
      `SELECT
        p.id, p.name, p.description, p.client_id, p.start_date, p.end_date,
        p.duration, p.status, p.phase, p.project_value,
        c.name AS client_name,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        dr.constraints AS latest_constraints,
        dr.report_date AS last_report_date,
        dr.progress_percentage AS last_reported_progress
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN LATERAL (
        SELECT constraints, report_date, progress_percentage
        FROM daily_reports
        WHERE project_id = p.id
        ORDER BY report_date DESC, created_at DESC
        LIMIT 1
      ) dr ON true
      WHERE p.status = 'active'
      ORDER BY
        CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
        ph.spi_value ASC NULLS LAST,
        p.end_date ASC`
    );

    const statsResult = await query(
      `SELECT
        COUNT(*)::int AS total_projects,
        COUNT(*) FILTER (WHERE p.status = 'active')::int AS active_projects,
        COUNT(*) FILTER (WHERE ph.status = 'red' AND p.status = 'active')::int AS total_red,
        COUNT(*) FILTER (WHERE ph.status = 'amber' AND p.status = 'active')::int AS total_amber,
        COUNT(*) FILTER (WHERE ph.status = 'green' AND p.status = 'active')::int AS total_green,
        COUNT(*) FILTER (WHERE ph.status IS NULL AND p.status = 'active')::int AS total_no_health,
        ROUND(AVG(ph.spi_value) FILTER (WHERE p.status = 'active'), 4) AS avg_spi,
        COUNT(*) FILTER (WHERE p.end_date < CURRENT_DATE AND p.status = 'active')::int AS overdue_projects
      FROM projects p
      LEFT JOIN project_health ph ON ph.project_id = p.id`
    );

    const taskStatsResult = await query(
      `SELECT
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS completed_tasks,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress_tasks,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_tasks,
        COUNT(*) FILTER (WHERE t.status = 'review')::int AS review_tasks,
        COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS overtime_tasks
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.status = 'active'`
    );

    const recentResult = await query(
      `(
        SELECT 'task_updated' AS type,
          t.name AS item_name,
          p.name AS project_name,
          p.id AS project_id,
          u.name AS user_name,
          t.updated_at AS activity_at,
          t.status AS detail
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.updated_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY t.updated_at DESC
        LIMIT 10
      )
      UNION ALL
      (
        SELECT 'report_submitted' AS type,
          'Daily Report' AS item_name,
          p.name AS project_name,
          p.id AS project_id,
          u.name AS user_name,
          dr.created_at AS activity_at,
          dr.progress_percentage::text AS detail
        FROM daily_reports dr
        JOIN projects p ON p.id = dr.project_id
        JOIN users u ON u.id = dr.created_by
        WHERE dr.report_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY dr.created_at DESC
        LIMIT 10
      )
      ORDER BY activity_at DESC
      LIMIT 20`
    );

    const escalationSummary = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review
      FROM escalations`
    );

    const stats = statsResult.rows[0] as Record<string, unknown>;
    const taskStats = taskStatsResult.rows[0] as Record<string, unknown>;
    const escStats = escalationSummary.rows[0] as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        projects: projectsResult.rows,
        summary: {
          ...stats,
          total_tasks: taskStats.total_tasks,
          completed_tasks: taskStats.completed_tasks,
          in_progress_tasks: taskStats.in_progress_tasks,
          working_tasks: taskStats.working_tasks,
          review_tasks: taskStats.review_tasks,
          overtime_tasks: taskStats.overtime_tasks,
          open_escalations: escStats.open,
          in_review_escalations: escStats.in_review,
        },
        recent_activity: recentResult.rows,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
