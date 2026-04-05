import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

// GET /api/projects - List all projects with health status, client info, task counts
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const result = await query(
      `SELECT
        p.id, p.name, p.description, p.client_id, p.start_date, p.end_date,
        p.duration, p.status, p.phase, p.project_value, p.survey_approved,
        p.target_description, p.created_at, p.updated_at,
        c.name AS client_name,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        dr.progress_percentage AS latest_progress,
        dr.constraints AS latest_constraints,
        dr.report_date AS last_report_date,
        u.name AS created_by_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN LATERAL (
        SELECT progress_percentage, constraints, report_date
        FROM daily_reports
        WHERE project_id = p.id
        ORDER BY report_date DESC, created_at DESC
        LIMIT 1
      ) dr ON true
      LEFT JOIN users u ON u.id = p.created_by
      ORDER BY
        CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
        p.end_date ASC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get projects error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects - Create project (manager/admin only)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const {
    name, description, client_id, start_date, end_date,
    project_value, target_description, phase,
  } = body;

  if (!name || !start_date || !end_date) {
    return NextResponse.json(
      { success: false, error: 'Name, start_date, and end_date are required' },
      { status: 400 }
    );
  }

  if (new Date(start_date) >= new Date(end_date)) {
    return NextResponse.json(
      { success: false, error: 'start_date must be before end_date' },
      { status: 400 }
    );
  }

  // Validate client_id if provided
  if (client_id) {
    try {
      const clientCheck = await query('SELECT id FROM clients WHERE id = $1', [client_id]);
      if (clientCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Client not found' }, { status: 400 });
      }
    } catch (err) {
      console.error('Client check error:', err);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  const projectPhase = phase === 'execution' ? 'execution' : 'survey';

  try {
    const result = await query(
      `INSERT INTO projects
        (name, description, client_id, start_date, end_date, status, phase,
         project_value, target_description, created_by)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9)
       RETURNING *`,
      [
        name, description || null, client_id || null,
        start_date, end_date, projectPhase,
        project_value || 0, target_description || null,
        auth.user.userId,
      ]
    );

    const project = result.rows[0] as { id: number };
    await recalculateSPI(project.id);

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (err) {
    console.error('Create project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
