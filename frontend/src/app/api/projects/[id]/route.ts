import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

// GET /api/projects/:id - Get single project with full detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const projectResult = await query(
      `SELECT
        p.*,
        c.id AS client_id_ref, c.name AS client_name, c.phone AS client_phone,
        c.email AS client_email, c.address AS client_address,
        ph.spi_value, ph.status AS health_status,
        ph.deviation_percent, ph.actual_progress, ph.planned_progress,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        ph.last_updated AS health_last_updated,
        u.name AS created_by_name,
        approver.name AS survey_approved_by_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN users u ON u.id = p.created_by
      LEFT JOIN users approver ON approver.id = p.survey_approved_by
      WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const [tasksResult, reportsResult, materialsResult, budgetResult, assignmentsResult] = await Promise.all([
      query(
        `SELECT t.*, u.name AS assigned_to_name,
          COUNT(te.id)::int AS evidence_count
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN task_evidence te ON te.task_id = t.id
        WHERE t.project_id = $1
        GROUP BY t.id, u.name
        ORDER BY t.sort_order ASC, t.created_at ASC`,
        [projectId]
      ),
      query(
        `SELECT dr.*, u.name AS reporter_name
         FROM daily_reports dr
         LEFT JOIN users u ON u.id = dr.created_by
         WHERE dr.project_id = $1
         ORDER BY dr.report_date DESC`,
        [projectId]
      ),
      query(
        `SELECT * FROM materials WHERE project_id = $1 ORDER BY created_at ASC`,
        [projectId]
      ),
      query(
        `SELECT * FROM budget_items WHERE project_id = $1 ORDER BY is_actual ASC, category ASC`,
        [projectId]
      ),
      query(
        `SELECT u.id, u.name, u.email, pa.assigned_at
         FROM project_assignments pa
         JOIN users u ON u.id = pa.user_id
         WHERE pa.project_id = $1`,
        [projectId]
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...projectResult.rows[0],
        tasks: tasksResult.rows,
        daily_reports: reportsResult.rows,
        materials: materialsResult.rows,
        budget_items: budgetResult.rows,
        assigned_technicians: assignmentsResult.rows,
      },
    });
  } catch (err) {
    console.error('Get project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/projects/:id - Update project (manager/admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  const body = await request.json();
  const {
    name, description, status, client_id, start_date, end_date,
    project_value, target_description, phase,
  } = body;

  const allowedStatuses = ['active', 'completed', 'on-hold', 'cancelled'];
  const allowedPhases = ['survey', 'execution'];

  try {
    const current = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const row = current.rows[0] as Record<string, unknown>;

    const updatedName = name !== undefined ? name : row.name;
    const updatedDesc = description !== undefined ? description : row.description;
    const updatedStatus = status && allowedStatuses.includes(status) ? status : row.status;
    const updatedClientId = client_id !== undefined ? client_id : row.client_id;
    const updatedStartDate = start_date !== undefined ? start_date : row.start_date;
    const updatedEndDate = end_date !== undefined ? end_date : row.end_date;
    const updatedValue = project_value !== undefined ? project_value : row.project_value;
    const updatedTarget = target_description !== undefined ? target_description : row.target_description;
    const updatedPhase = phase && allowedPhases.includes(phase) ? phase : row.phase;

    if (start_date || end_date) {
      if (new Date(updatedStartDate as string) >= new Date(updatedEndDate as string)) {
        return NextResponse.json(
          { success: false, error: 'start_date must be before end_date' },
          { status: 400 }
        );
      }
    }

    const result = await query(
      `UPDATE projects SET
        name = $1, description = $2, status = $3, client_id = $4,
        start_date = $5, end_date = $6, project_value = $7,
        target_description = $8, phase = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *`,
      [
        updatedName, updatedDesc, updatedStatus, updatedClientId || null,
        updatedStartDate, updatedEndDate, updatedValue,
        updatedTarget, updatedPhase, projectId,
      ]
    );

    if (start_date || end_date || status) {
      await recalculateSPI(projectId);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/:id - Delete project (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [projectId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
