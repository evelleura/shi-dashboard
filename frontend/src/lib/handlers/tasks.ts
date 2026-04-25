import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query, getClient } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

const VALID_STATUSES = ['to_do', 'in_progress', 'working_on_it', 'review', 'done'];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  to_do: ['in_progress'],
  in_progress: ['to_do', 'review'],
  working_on_it: ['in_progress'],
  review: ['in_progress'],
  done: [],
};

export async function createTask(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, name, description, assigned_to, due_date, timeline_start, timeline_end, notes, budget, sort_order, is_survey_task } = body;

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
    let taskSortOrder = sort_order;
    if (taskSortOrder === undefined || taskSortOrder === null) {
      const maxOrder = await query<{ max_order: string }>(
        'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tasks WHERE project_id = $1', [project_id]
      );
      taskSortOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;
    }
    const result = await query(
      `INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date,
         timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, created_by)
       VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [project_id, name.trim(), description || null, assigned_to || null,
       due_date || null, timeline_start || null, timeline_end || null,
       notes || null, budget || 0, taskSortOrder, is_survey_task || false, auth.user.userId]
    );
    await recalculateSPI(parseInt(project_id));
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
        (SELECT COUNT(*)::int FROM task_activities WHERE task_id = t.id) AS activity_count
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN users creator ON creator.id = t.created_by
       LEFT JOIN projects p ON p.id = t.project_id
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
    const { name, description, assigned_to, status, due_date, timeline_start, timeline_end, notes, budget, sort_order, is_survey_task } = body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const result = await query(
      `UPDATE tasks SET name=$1, description=$2, assigned_to=$3, status=$4, due_date=$5,
        timeline_start=$6, timeline_end=$7, notes=$8, budget=$9, sort_order=$10,
        is_survey_task=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [
        name !== undefined ? name : row.name,
        description !== undefined ? description : row.description,
        (assigned_to !== undefined ? assigned_to : row.assigned_to) || null,
        status !== undefined ? status : row.status,
        (due_date !== undefined ? due_date : row.due_date) || null,
        (timeline_start !== undefined ? timeline_start : row.timeline_start) || null,
        (timeline_end !== undefined ? timeline_end : row.timeline_end) || null,
        (notes !== undefined ? notes : row.notes) || null,
        budget !== undefined ? budget : row.budget,
        sort_order !== undefined ? sort_order : row.sort_order,
        is_survey_task !== undefined ? is_survey_task : row.is_survey_task,
        taskId,
      ]
    );

    if (status !== undefined && status !== row.status) {
      await recalculateSPI(row.project_id as number);
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
    const task = await query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    if (task.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const projectId = (task.rows[0] as Record<string, unknown>).project_id as number;
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

    const result = await query(
      'UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, taskId]
    );
    if (currentStatus !== status) await recalculateSPI(task.project_id as number);
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
        COUNT(te.id)::int AS evidence_count
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users creator ON creator.id = t.created_by
      LEFT JOIN task_evidence te ON te.task_id = t.id
      WHERE t.project_id = $1
    `;
    const sqlParams: unknown[] = [id];
    if (auth.user.role === 'technician') {
      sql += ' AND t.assigned_to = $2';
      sqlParams.push(auth.user.userId);
    }
    sql += ' GROUP BY t.id, u.name, creator.name ORDER BY t.sort_order ASC, t.created_at ASC';
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
              t.assigned_to, t.time_spent_seconds, t.is_tracking, t.sort_order,
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
