import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query, getClient } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';
import { logChange } from './audit';

const VALID_STATUSES = ['to_do', 'in_progress', 'working_on_it', 'review', 'done'];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  to_do: ['in_progress'],
  in_progress: ['to_do', 'review'],
  working_on_it: ['in_progress'],
  review: ['in_progress'],
  done: [],
};

// Walk depends_on chain to detect circular refs (max 10 levels)
async function hasCircularDependency(taskId: number, dependsOn: number): Promise<boolean> {
  let current = dependsOn;
  for (let i = 0; i < 10; i++) {
    if (current === taskId) return true;
    const res = await query('SELECT depends_on FROM tasks WHERE id = $1', [current]);
    if (res.rowCount === 0 || res.rows[0].depends_on == null) return false;
    current = (res.rows[0] as { depends_on: number }).depends_on;
  }
  return false;
}

// Check if technician has overlapping tasks (for double-booking)
async function findConflicts(technicianId: number, start: string, end: string, excludeTaskId?: number): Promise<Record<string, unknown>[]> {
  const params: unknown[] = [technicianId, start, end];
  let sql = `
    SELECT t.id, t.name, p.name AS project_name, t.timeline_start, t.timeline_end, u.name AS assigned_to_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.assigned_to = $1
      AND t.status != 'done'
      AND t.timeline_start IS NOT NULL AND t.timeline_end IS NOT NULL
      AND t.timeline_start <= $3 AND t.timeline_end >= $2
  `;
  if (excludeTaskId) {
    params.push(excludeTaskId);
    sql += ` AND t.id != $${params.length}`;
  }
  const res = await query(sql, params);
  return res.rows as Record<string, unknown>[];
}

export async function createTask(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, name, description, assigned_to, due_date, timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, depends_on } = body;

  if (!project_id || !name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'project_id and name are required' }, { status: 400 });
  }

  try {
    const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    if (assigned_to) {
      const userCheck = await query('SELECT id FROM users WHERE id = $1', [assigned_to]);
      if (userCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Assigned user not found' }, { status: 400 });
      }
    }

    // Validate depends_on: must be a task in the same project
    if (depends_on != null) {
      const depCheck = await query('SELECT project_id FROM tasks WHERE id = $1', [depends_on]);
      if (depCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Tugas yang menjadi prasyarat tidak ditemukan' }, { status: 400 });
      }
      if ((depCheck.rows[0] as { project_id: number }).project_id !== parseInt(project_id)) {
        return NextResponse.json({ success: false, error: 'Tugas prasyarat harus berada dalam proyek yang sama' }, { status: 400 });
      }
    }

    // Double-booking check
    if (assigned_to && timeline_start && timeline_end) {
      const conflicts = await findConflicts(assigned_to, timeline_start, timeline_end);
      if (conflicts.length > 0) {
        const names = conflicts.map((c) => c.name as string).join(', ');
        return NextResponse.json({
          success: false,
          error: `Teknisi sudah memiliki tugas pada rentang waktu tersebut: ${names}`,
        }, { status: 409 });
      }
    }

    let taskSortOrder = sort_order;
    if (taskSortOrder === undefined || taskSortOrder === null) {
      const maxOrder = await query<{ max_order: string }>(
        'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tasks WHERE project_id = $1', [project_id]
      );
      taskSortOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;
    }
    const result = await query(
      `INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date,
         timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, depends_on, created_by)
       VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [project_id, name.trim(), description || null, assigned_to || null,
       due_date || null, timeline_start || null, timeline_end || null,
       notes || null, budget || 0, taskSortOrder, is_survey_task || false,
       depends_on || null, auth.user.userId]
    );
    await recalculateSPI(parseInt(project_id));
    const actorName1 = ((await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
    await logChange({
      entityType: 'task', entityId: result.rows[0].id as number, entityName: name.trim(),
      action: 'create', changes: [{ field: '*', oldValue: null, newValue: name.trim() }],
      userId: auth.user.userId, userName: actorName1,
    });
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function bulkCreateTasks(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, tasks: taskList } = body;
  if (!project_id || !Array.isArray(taskList) || taskList.length === 0) {
    return NextResponse.json({ success: false, error: 'project_id and tasks array are required' }, { status: 400 });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const projectCheck = await client.query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const maxOrder = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tasks WHERE project_id = $1', [project_id]
    );
    let nextOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;
    const created = [];
    for (const task of taskList) {
      if (!task.name || typeof task.name !== 'string' || task.name.trim().length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'Each task must have a name' }, { status: 400 });
      }
      const result = await client.query(
        `INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date,
           timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, created_by)
         VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [project_id, task.name.trim(), task.description || null, task.assigned_to || null,
         task.due_date || null, task.timeline_start || null, task.timeline_end || null,
         task.notes || null, task.budget || 0, nextOrder++, task.is_survey_task || false, auth.user.userId]
      );
      created.push(result.rows[0]);
    }
    await client.query('COMMIT');
    await recalculateSPI(parseInt(project_id));
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk create tasks error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function getTask(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const taskResult = await query(
      `SELECT t.*, u.name AS assigned_to_name, creator.name AS created_by_name,
        p.name AS project_name,
        dep.name AS depends_on_name,
        (SELECT COUNT(*)::int FROM task_activities WHERE task_id = t.id) AS activity_count
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN users creator ON creator.id = t.created_by
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN tasks dep ON dep.id = t.depends_on
       WHERE t.id = $1`,
      [taskId]
    );
    if (taskResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const task = taskResult.rows[0] as Record<string, unknown>;
    if (auth.user.role === 'technician' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    const evidenceResult = await query(
      `SELECT te.*, u.name AS uploaded_by_name FROM task_evidence te
       LEFT JOIN users u ON u.id = te.uploaded_by
       WHERE te.task_id = $1 ORDER BY te.uploaded_at DESC`,
      [taskId]
    );
    return NextResponse.json({ success: true, data: { ...task, evidence: evidenceResult.rows } });
  } catch (err) {
    console.error('Get task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateTask(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const current = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;
    const body = await request.json();
    const { name, description, assigned_to, status, due_date, timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, depends_on } = body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    // Validate depends_on
    const newDependsOn = depends_on !== undefined ? depends_on : row.depends_on;
    if (newDependsOn != null) {
      const depCheck = await query('SELECT project_id FROM tasks WHERE id = $1', [newDependsOn]);
      if (depCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Tugas yang menjadi prasyarat tidak ditemukan' }, { status: 400 });
      }
      if ((depCheck.rows[0] as { project_id: number }).project_id !== (row.project_id as number)) {
        return NextResponse.json({ success: false, error: 'Tugas prasyarat harus berada dalam proyek yang sama' }, { status: 400 });
      }
      if (await hasCircularDependency(taskId, newDependsOn as number)) {
        return NextResponse.json({ success: false, error: 'Tidak bisa membuat dependensi melingkar' }, { status: 400 });
      }
    }

    // Double-booking check
    const newAssignedTo = assigned_to !== undefined ? assigned_to : row.assigned_to;
    const newStart = (timeline_start !== undefined ? timeline_start : row.timeline_start) as string | null;
    const newEnd = (timeline_end !== undefined ? timeline_end : row.timeline_end) as string | null;
    if (newAssignedTo && newStart && newEnd) {
      const conflicts = await findConflicts(newAssignedTo as number, newStart, newEnd, taskId);
      if (conflicts.length > 0) {
        const names = conflicts.map((c) => c.name as string).join(', ');
        return NextResponse.json({
          success: false,
          error: `Teknisi sudah memiliki tugas pada rentang waktu tersebut: ${names}`,
        }, { status: 409 });
      }
    }

    const result = await query(
      `UPDATE tasks SET name=$1, description=$2, assigned_to=$3, status=$4, due_date=$5,
        timeline_start=$6, timeline_end=$7, notes=$8, budget=$9, sort_order=$10,
        is_survey_task=$11, depends_on=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [
        name !== undefined ? name : row.name,
        description !== undefined ? description : row.description,
        (assigned_to !== undefined ? assigned_to : row.assigned_to) || null,
        status !== undefined ? status : row.status,
        (due_date !== undefined ? due_date : row.due_date) || null,
        newStart || null,
        newEnd || null,
        (notes !== undefined ? notes : row.notes) || null,
        budget !== undefined ? budget : row.budget,
        sort_order !== undefined ? sort_order : row.sort_order,
        is_survey_task !== undefined ? is_survey_task : row.is_survey_task,
        newDependsOn || null,
        taskId,
      ]
    );

    if (status !== undefined && status !== row.status) {
      await recalculateSPI(row.project_id as number);
    }

    // Log all changed fields
    const trackFields: { field: string; key: string; newVal: unknown }[] = [
      { field: 'name', key: 'name', newVal: name },
      { field: 'description', key: 'description', newVal: description },
      { field: 'assigned_to', key: 'assigned_to', newVal: assigned_to },
      { field: 'status', key: 'status', newVal: status },
      { field: 'due_date', key: 'due_date', newVal: due_date },
      { field: 'timeline_start', key: 'timeline_start', newVal: timeline_start },
      { field: 'timeline_end', key: 'timeline_end', newVal: timeline_end },
      { field: 'depends_on', key: 'depends_on', newVal: depends_on },
    ];
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
    for (const f of trackFields) {
      if (f.newVal !== undefined) {
        const oldVal = String(row[f.key] ?? '');
        const newVal = String(f.newVal ?? '');
        if (oldVal !== newVal) changes.push({ field: f.field, oldValue: oldVal || null, newValue: newVal || null });
      }
    }
    if (changes.length > 0) {
      const actorName2 = ((await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
      await logChange({
        entityType: 'task', entityId: taskId, entityName: (name !== undefined ? name : row.name) as string,
        action: 'update', changes,
        userId: auth.user.userId, userName: actorName2,
      });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteTask(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const task = await query('SELECT project_id, name FROM tasks WHERE id = $1', [taskId]);
    if (task.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const taskRow = task.rows[0] as Record<string, unknown>;
    const projectId = taskRow.project_id as number;
    const actorName3 = ((await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
    await logChange({
      entityType: 'task', entityId: taskId, entityName: taskRow.name as string,
      action: 'delete', changes: [{ field: '*', oldValue: taskRow.name as string, newValue: null }],
      userId: auth.user.userId, userName: actorName3,
    });
    await query('DELETE FROM tasks WHERE id = $1', [taskId]);
    await recalculateSPI(projectId);
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function changeTaskStatus(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  const body = await request.json();
  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  try {
    const current = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const task = current.rows[0] as Record<string, unknown>;
    const currentStatus = task.status as string;

    if (auth.user.role === 'technician') {
      if (task.assigned_to !== auth.user.userId) {
        return NextResponse.json({ success: false, error: 'You can only change status of tasks assigned to you' }, { status: 403 });
      }
      const allowed = STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json({
          success: false,
          error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`,
        }, { status: 400 });
      }
    } else if (!['manager', 'admin'].includes(auth.user.role)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Dependency check: if this task depends on another and that task is not done, block status change
    if (task.depends_on != null) {
      const dep = await query('SELECT status, name FROM tasks WHERE id = $1', [task.depends_on]);
      if (dep.rowCount !== 0 && (dep.rows[0] as { status: string }).status !== 'done') {
        const depName = (dep.rows[0] as { name: string }).name;
        return NextResponse.json({
          success: false,
          error: `Tugas ini bergantung pada tugas lain yang belum selesai: "${depName}"`,
        }, { status: 400 });
      }
    }

    const result = await query(
      'UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, taskId]
    );
    if (currentStatus !== status) {
      await recalculateSPI(task.project_id as number);
      const actorName4 = ((await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
      await logChange({
        entityType: 'task', entityId: taskId, entityName: task.name as string,
        action: 'update', changes: [{ field: 'status', oldValue: currentStatus, newValue: status }],
        userId: auth.user.userId, userName: actorName4,
      });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Change task status error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function reorderTask(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  const body = await request.json();
  const { sort_order } = body;
  if (sort_order === undefined || typeof sort_order !== 'number' || sort_order < 0) {
    return NextResponse.json({ success: false, error: 'sort_order must be a non-negative number' }, { status: 400 });
  }

  try {
    const result = await query(
      'UPDATE tasks SET sort_order=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [sort_order, taskId]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Reorder task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getTasksByProject(request: NextRequest, projectId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(projectId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    let sql = `
      SELECT t.*, u.name AS assigned_to_name, creator.name AS created_by_name,
        dep.name AS depends_on_name,
        COUNT(te.id)::int AS evidence_count
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users creator ON creator.id = t.created_by
      LEFT JOIN tasks dep ON dep.id = t.depends_on
      LEFT JOIN task_evidence te ON te.task_id = t.id
      WHERE t.project_id = $1
    `;
    const sqlParams: unknown[] = [id];
    if (auth.user.role === 'technician') {
      sql += ' AND t.assigned_to = $2';
      sqlParams.push(auth.user.userId);
    }
    sql += ' GROUP BY t.id, u.name, creator.name, dep.name ORDER BY t.sort_order ASC, t.created_at ASC';
    const result = await query(sql, sqlParams);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get tasks error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getScheduleTasks(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT t.id, t.name, t.status, t.due_date, t.timeline_start, t.timeline_end,
              t.assigned_to, t.time_spent_seconds, t.is_tracking, t.sort_order, t.depends_on,
              u.name AS assigned_to_name,
              p.id AS project_id, p.project_code, p.name AS project_name,
              p.start_date AS project_start, p.end_date AS project_end,
              p.category AS project_category, p.status AS project_status,
              ph.status AS health_status
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN project_health ph ON ph.project_id = p.id
       WHERE p.status IN ('active', 'on-hold')
       ORDER BY p.end_date ASC, t.sort_order ASC, t.due_date ASC NULLS LAST`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get schedule tasks error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/tasks/conflicts?technician_id=&start=&end=&exclude_task_id=
export async function checkConflicts(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const params = request.nextUrl.searchParams;
  const technicianId = parseInt(params.get('technician_id') || '');
  const start = params.get('start');
  const end = params.get('end');
  const excludeId = params.get('exclude_task_id');

  if (isNaN(technicianId) || !start || !end) {
    return NextResponse.json({ success: false, error: 'technician_id, start, and end are required' }, { status: 400 });
  }

  try {
    const conflicts = await findConflicts(technicianId, start, end, excludeId ? parseInt(excludeId) : undefined);
    return NextResponse.json({ success: true, data: conflicts });
  } catch (err) {
    console.error('Check conflicts error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
