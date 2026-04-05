import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

// POST /api/daily-reports - Submit daily report (technician)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['technician', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, task_id, report_date, progress_percentage, constraints } = body;

  if (!project_id || !report_date || progress_percentage === undefined) {
    return NextResponse.json(
      { success: false, error: 'project_id, report_date, and progress_percentage are required' },
      { status: 400 }
    );
  }

  const progress = parseFloat(progress_percentage);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    return NextResponse.json(
      { success: false, error: 'progress_percentage must be between 0 and 100' },
      { status: 400 }
    );
  }

  try {
    const projectResult = await query(
      "SELECT id, status FROM projects WHERE id = $1",
      [project_id]
    );

    if (projectResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if ((projectResult.rows[0] as Record<string, unknown>).status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Can only submit reports for active projects' },
        { status: 400 }
      );
    }

    if (task_id) {
      const taskCheck = await query('SELECT id, project_id FROM tasks WHERE id = $1', [task_id]);
      if (taskCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 400 });
      }
      const task = taskCheck.rows[0] as { project_id: number };
      if (task.project_id !== parseInt(project_id)) {
        return NextResponse.json(
          { success: false, error: 'Task does not belong to this project' },
          { status: 400 }
        );
      }
    }

    if (auth.user.role === 'technician') {
      const assigned = await query(
        'SELECT 1 FROM project_assignments WHERE project_id = $1 AND user_id = $2',
        [project_id, auth.user.userId]
      );
      if (assigned.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'You are not assigned to this project' },
          { status: 403 }
        );
      }
    }

    const result = await query(
      `INSERT INTO daily_reports (project_id, task_id, report_date, progress_percentage, constraints, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (project_id, report_date, created_by)
       DO UPDATE SET
         progress_percentage = EXCLUDED.progress_percentage,
         constraints = EXCLUDED.constraints,
         task_id = EXCLUDED.task_id
       RETURNING *`,
      [project_id, task_id || null, report_date, progress, constraints || null, auth.user.userId]
    );

    const health = await recalculateSPI(parseInt(project_id));

    return NextResponse.json(
      { success: true, data: { report: result.rows[0], health } },
      { status: 201 }
    );
  } catch (err) {
    console.error('Submit report error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/daily-reports - Get reports
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const searchParams = request.nextUrl.searchParams;
  const project_id = searchParams.get('project_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    let sql = `
      SELECT dr.*, u.name AS reporter_name, p.name AS project_name,
             t.name AS task_name
      FROM daily_reports dr
      LEFT JOIN users u ON u.id = dr.created_by
      LEFT JOIN projects p ON p.id = dr.project_id
      LEFT JOIN tasks t ON t.id = dr.task_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (auth.user.role === 'technician') {
      sql += ` AND dr.created_by = $${paramIndex++}`;
      params.push(auth.user.userId);
    }

    if (project_id) {
      sql += ` AND dr.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    if (from) {
      sql += ` AND dr.report_date >= $${paramIndex++}`;
      params.push(from);
    }

    if (to) {
      sql += ` AND dr.report_date <= $${paramIndex++}`;
      params.push(to);
    }

    sql += ' ORDER BY dr.report_date DESC, dr.created_at DESC';

    const result = await query(sql, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get reports error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
