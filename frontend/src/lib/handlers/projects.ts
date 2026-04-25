import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query, getClient } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';
import { logChange } from './audit';

async function generateProjectCode(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `SHI-${yy}${mm}`;

  // Find the highest sequence number for this month
  const result = await query<{ max_seq: string }>(
    `SELECT MAX(SUBSTRING(project_code FROM $1))::int AS max_seq
     FROM projects WHERE project_code LIKE $2`,
    [`^${prefix}(\\d+)$`, `${prefix}%`]
  );
  const nextSeq = ((result.rows[0]?.max_seq as unknown as number) || 0) + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

export async function listProjects(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const result = await query(
      `SELECT p.id, p.project_code, p.name, p.description, p.client_id, p.start_date, p.end_date,
        p.duration, p.status, p.phase, p.category, p.project_value, p.survey_approved,
        p.target_description, p.created_at, p.updated_at,
        c.name AS client_name,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        dr.progress_percentage AS latest_progress,
        dr.constraints AS latest_constraints, dr.report_date AS last_report_date,
        u.name AS created_by_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN LATERAL (
        SELECT progress_percentage, constraints, report_date
        FROM daily_reports WHERE project_id = p.id
        ORDER BY report_date DESC, created_at DESC LIMIT 1
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

export async function createProject(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, description, client_id, start_date, end_date, project_value, target_description, phase, category } = body;
  const allowedCategories = ['instalasi', 'maintenance', 'perbaikan', 'upgrade', 'monitoring', 'security', 'networking', 'lainnya'];

  if (!name || !start_date || !end_date) {
    return NextResponse.json({ success: false, error: 'Name, start_date, and end_date are required' }, { status: 400 });
  }
  if (new Date(start_date) >= new Date(end_date)) {
    return NextResponse.json({ success: false, error: 'start_date must be before end_date' }, { status: 400 });
  }
  if (client_id) {
    const clientCheck = await query('SELECT id FROM clients WHERE id = $1', [client_id]);
    if (clientCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 400 });
    }
  }

  try {
    const projectCode = await generateProjectCode();
    const validCategory = category && allowedCategories.includes(category) ? category : 'instalasi';
    const result = await query(
      `INSERT INTO projects (project_code, name, description, client_id, start_date, end_date, status, phase, category,
         project_value, target_description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11) RETURNING *`,
      [projectCode, name, description || null, client_id || null, start_date, end_date,
       phase === 'execution' ? 'execution' : 'survey', validCategory, project_value || 0, target_description || null, auth.user.userId]
    );
    const project = result.rows[0] as { id: number; name: string };
    await recalculateSPI(project.id);
    const creatorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'project',
      entityId: project.id,
      entityName: project.name,
      action: 'create',
      changes: [{ field: '*', oldValue: null, newValue: project.name }],
      userId: auth.user.userId,
      userName: creatorName,
    });
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (err) {
    console.error('Create project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getProject(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const projectResult = await query(
      `SELECT p.*, c.id AS client_id_ref, c.name AS client_name, c.phone AS client_phone,
        c.email AS client_email, c.address AS client_address,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent, ph.actual_progress, ph.planned_progress,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        ph.last_updated AS health_last_updated,
        u.name AS created_by_name, approver.name AS survey_approved_by_name
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
        `SELECT t.*, u.name AS assigned_to_name, COUNT(te.id)::int AS evidence_count
         FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
         LEFT JOIN task_evidence te ON te.task_id = t.id
         WHERE t.project_id = $1 GROUP BY t.id, u.name ORDER BY t.sort_order ASC, t.created_at ASC`,
        [projectId]
      ),
      query(
        `SELECT dr.*, u.name AS reporter_name FROM daily_reports dr
         LEFT JOIN users u ON u.id = dr.created_by
         WHERE dr.project_id = $1 ORDER BY dr.report_date DESC`,
        [projectId]
      ),
      query('SELECT * FROM materials WHERE project_id = $1 ORDER BY created_at ASC', [projectId]),
      query('SELECT * FROM budget_items WHERE project_id = $1 ORDER BY is_actual ASC, category ASC', [projectId]),
      query(
        `SELECT u.id, u.name, u.email, pa.assigned_at FROM project_assignments pa
         JOIN users u ON u.id = pa.user_id WHERE pa.project_id = $1`,
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

export async function updateProject(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, description, status, client_id, start_date, end_date, project_value, target_description, phase, category } = body;
  const allowedStatuses = ['active', 'completed', 'on-hold', 'cancelled'];
  const allowedPhases = ['survey', 'execution'];
  const allowedCats = ['instalasi', 'maintenance', 'perbaikan', 'upgrade', 'monitoring', 'security', 'networking', 'lainnya'];

  try {
    const current = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;
    const updatedStartDate = start_date !== undefined ? start_date : row.start_date;
    const updatedEndDate = end_date !== undefined ? end_date : row.end_date;
    if (start_date || end_date) {
      if (new Date(updatedStartDate as string) >= new Date(updatedEndDate as string)) {
        return NextResponse.json({ success: false, error: 'start_date must be before end_date' }, { status: 400 });
      }
    }
    const result = await query(
      `UPDATE projects SET name=$1, description=$2, status=$3, client_id=$4,
        start_date=$5, end_date=$6, project_value=$7, target_description=$8, phase=$9, category=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [
        name !== undefined ? name : row.name,
        description !== undefined ? description : row.description,
        status && allowedStatuses.includes(status) ? status : row.status,
        client_id !== undefined ? client_id || null : row.client_id,
        updatedStartDate, updatedEndDate,
        project_value !== undefined ? project_value : row.project_value,
        target_description !== undefined ? target_description : row.target_description,
        phase && allowedPhases.includes(phase) ? phase : row.phase,
        category && allowedCats.includes(category) ? category : row.category,
        projectId,
      ]
    );
    if (start_date || end_date || status) await recalculateSPI(projectId);
    const updated = result.rows[0] as Record<string, unknown>;
    const userName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    const auditFields = ['name', 'description', 'status', 'client_id', 'start_date', 'end_date', 'project_value', 'target_description', 'phase', 'category'];
    const changes = auditFields
      .filter(f => String(updated[f] ?? '') !== String(row[f] ?? ''))
      .map(f => ({ field: f, oldValue: String(row[f] ?? ''), newValue: String(updated[f] ?? '') }));
    if (changes.length > 0) {
      await logChange({
        entityType: 'project',
        entityId: projectId,
        entityName: String(updated.name),
        action: 'update',
        changes,
        userId: auth.user.userId,
        userName,
      });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteProject(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const existing = await query('SELECT id, name FROM projects WHERE id = $1', [projectId]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const existingProject = existing.rows[0] as { id: number; name: string };
    const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [projectId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const deleterName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'project',
      entityId: projectId,
      entityName: existingProject.name,
      action: 'delete',
      changes: [{ field: '*', oldValue: existingProject.name, newValue: null }],
      userId: auth.user.userId,
      userName: deleterName,
    });
    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function approveSurvey(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const current = await query('SELECT phase, survey_approved FROM projects WHERE id = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const project = current.rows[0] as { phase: string; survey_approved: boolean };
    if (project.phase !== 'survey') {
      return NextResponse.json({ success: false, error: 'Project is not in survey phase' }, { status: 400 });
    }
    if (project.survey_approved) {
      return NextResponse.json({ success: false, error: 'Survey already approved' }, { status: 400 });
    }
    const result = await query(
      `UPDATE projects SET phase='execution', survey_approved=TRUE,
        survey_approved_by=$1, survey_approved_at=NOW(), updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [auth.user.userId, projectId]
    );
    return NextResponse.json({
      success: true, data: result.rows[0],
      message: 'Survey approved. Project moved to execution phase.',
    });
  } catch (err) {
    console.error('Approve survey error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function rejectSurvey(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const current = await query('SELECT phase FROM projects WHERE id = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    if ((current.rows[0] as { phase: string }).phase !== 'survey') {
      return NextResponse.json({ success: false, error: 'Project is not in survey phase' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const reason = (body as Record<string, string>).reason;
    await query(
      `UPDATE tasks SET status='to_do', updated_at=NOW()
       WHERE project_id=$1 AND is_survey_task=TRUE AND status='done'`,
      [projectId]
    );
    await recalculateSPI(projectId);
    return NextResponse.json({
      success: true, message: 'Survey rejected. Survey tasks have been reset.',
      data: { reason: reason || 'No reason provided' },
    });
  } catch (err) {
    console.error('Reject survey error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function autoAssign(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  const body = await request.json();
  const { user_ids } = body;
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ success: false, error: 'user_ids array is required and must not be empty' }, { status: 400 });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const unassigned = await client.query(
      'SELECT id FROM tasks WHERE project_id = $1 AND assigned_to IS NULL ORDER BY sort_order ASC',
      [projectId]
    );
    if (unassigned.rowCount === 0) {
      await client.query('COMMIT');
      return NextResponse.json({ success: true, data: { assigned_count: 0 }, message: 'No unassigned tasks found' });
    }
    let assignedCount = 0;
    for (let i = 0; i < unassigned.rows.length; i++) {
      await client.query(
        'UPDATE tasks SET assigned_to=$1, updated_at=NOW() WHERE id=$2',
        [user_ids[i % user_ids.length], (unassigned.rows[i] as { id: number }).id]
      );
      assignedCount++;
    }
    await client.query('COMMIT');
    return NextResponse.json({
      success: true, data: { assigned_count: assignedCount },
      message: `${assignedCount} tasks assigned to ${user_ids.length} technicians`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Auto-assign error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function listAssignments(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, pa.assigned_at FROM project_assignments pa
       JOIN users u ON u.id = pa.user_id WHERE pa.project_id = $1`,
      [projectId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get assignments error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function assignTechnician(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  const body = await request.json();
  const { user_id } = body;
  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
  }

  try {
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 400 });
    }
    await query(
      'INSERT INTO project_assignments (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [projectId, user_id]
    );
    return NextResponse.json({ success: true, message: 'Technician assigned successfully' }, { status: 201 });
  } catch (err) {
    console.error('Assign technician error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function unassignTechnician(request: NextRequest, id: string, userId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  const userIdNum = parseInt(userId);
  if (isNaN(projectId) || isNaN(userIdNum)) {
    return NextResponse.json({ success: false, error: 'Invalid project or user ID' }, { status: 400 });
  }

  try {
    const result = await query(
      'DELETE FROM project_assignments WHERE project_id=$1 AND user_id=$2 RETURNING project_id',
      [projectId, userIdNum]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Technician unassigned successfully' });
  } catch (err) {
    console.error('Unassign technician error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
