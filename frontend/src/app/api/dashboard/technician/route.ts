import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/dashboard/technician
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const userId = auth.user.userId;

  try {
    const taskSummary = await query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_on_it,
        COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS overtime,
        COUNT(*) FILTER (WHERE t.status = 'to_do' AND t.due_date < CURRENT_DATE)::int AS over_deadline,
        COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done'))::int AS overdue
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.assigned_to = $1 AND p.status = 'active'`,
      [userId]
    );

    const assignedProjects = await query(
      `SELECT
        p.id, p.name, p.phase, p.start_date, p.end_date,
        p.target_description, p.project_value,
        c.name AS client_name, c.address AS client_address, c.phone AS client_phone,
        ph.spi_value, ph.status AS health_status,
        COUNT(t.id) FILTER (WHERE t.assigned_to = $1)::int AS my_task_count,
        COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::int AS my_completed
      FROM projects p
      JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = $1
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.phase, p.start_date, p.end_date,
        p.target_description, p.project_value,
        c.name, c.address, c.phone,
        ph.spi_value, ph.status
      ORDER BY p.end_date ASC`,
      [userId]
    );

    const recentTasks = await query(
      `SELECT t.*,
        u.name AS assigned_to_name,
        p.name AS project_name,
        COUNT(te.id)::int AS evidence_count,
        (SELECT COUNT(*)::int FROM task_activities WHERE task_id = t.id) AS activity_count
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN task_evidence te ON te.task_id = t.id
      WHERE t.assigned_to = $1 AND p.status = 'active'
      GROUP BY t.id, u.name, p.name
      ORDER BY t.sort_order ASC, t.due_date ASC NULLS LAST`,
      [userId]
    );

    const completedProjects = await query(
      `SELECT
        p.id, p.name, p.phase, p.start_date, p.end_date, p.status,
        c.name AS client_name, c.address AS client_address,
        COUNT(t.id) FILTER (WHERE t.assigned_to = $1)::int AS my_task_count,
        COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::int AS my_completed
      FROM projects p
      JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = $1
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.status IN ('completed', 'on-hold', 'cancelled')
      GROUP BY p.id, p.name, p.phase, p.start_date, p.end_date, p.status,
        c.name, c.address
      ORDER BY p.updated_at DESC`,
      [userId]
    );

    const myEscalations = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved
      FROM escalations WHERE reported_by = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        my_tasks: taskSummary.rows[0],
        assigned_projects: assignedProjects.rows,
        completed_projects: completedProjects.rows,
        recent_tasks: recentTasks.rows,
        escalation_summary: myEscalations.rows[0],
      },
    });
  } catch (err) {
    console.error('Technician dashboard error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
