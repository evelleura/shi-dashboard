import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { roleSatisfies, ROLES } from '@/lib/rbac';
import { query, getClient } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';
import { logChange } from './audit';
import { createNotification } from './notifications';

// Status 3 sesuai naskah (Tabel 4.13). Gate review: teknisi mentok di
// working_on_it, hanya manajer yang boleh menandai done.
const VALID_STATUSES = ['to_do', 'working_on_it', 'done'];

const ACTIVE_STATUSES = new Set(['working_on_it']);

// Transisi yang diizinkan untuk teknisi (manajer tidak dibatasi -> bisa ke done).
const STATUS_TRANSITIONS: Record<string, string[]> = {
  to_do:         ['working_on_it'],
  working_on_it: ['to_do'],
  done:          [],
};

// Kolom tb_tugas di-alias balik ke nama JS (id, project_id, name).
const TUGAS_COLS = `t.id_tugas AS id, t.id_proyek AS project_id, t.nama_tugas AS name, t.description,
  t.assigned_to, t.status, t.due_date, t.timeline_start, t.timeline_end, t.notes, t.sort_order,
  t.is_survey_task, t.time_spent_seconds, t.estimated_hours, t.depends_on, t.status_changed_at,
  t.created_by, t.created_at, t.updated_at`;
const TUGAS_RETURNING = `RETURNING id_tugas AS id, id_proyek AS project_id, nama_tugas AS name, description,
  assigned_to, status, due_date, timeline_start, timeline_end, notes, sort_order, is_survey_task,
  time_spent_seconds, estimated_hours, depends_on, status_changed_at, created_by, created_at, updated_at`;

// Map a status transition to a task_activities.activity_type label.
function activityTypeForTransition(from: string, to: string): string {
  if (to === 'done') return 'complete';
  if (ACTIVE_STATUSES.has(to) && !ACTIVE_STATUSES.has(from)) {
    return from === 'to_do' ? 'start_work' : 'resume';
  }
  if (ACTIVE_STATUSES.has(from) && !ACTIVE_STATUSES.has(to)) return 'pause';
  return 'note';
}

// Walk depends_on chain to detect circular refs (max 10 levels)
async function hasCircularDependency(taskId: number, dependsOn: number): Promise<boolean> {
  let current = dependsOn;
  for (let i = 0; i < 10; i++) {
    if (current === taskId) return true;
    const res = await query('SELECT depends_on FROM tb_tugas WHERE id_tugas = $1', [current]);
    if (res.rowCount === 0 || res.rows[0].depends_on == null) return false;
    current = (res.rows[0] as { depends_on: number }).depends_on;
  }
  return false;
}

// Check if technician has overlapping tasks (for double-booking)
async function findConflicts(technicianId: number, start: string, end: string, excludeTaskId?: number): Promise<Record<string, unknown>[]> {
  const params: unknown[] = [technicianId, start, end];
  let sql = `
    SELECT t.id_tugas AS id, t.nama_tugas AS name, p.nama_proyek AS project_name, t.timeline_start, t.timeline_end, u.nama AS assigned_to_name
    FROM tb_tugas t
    JOIN tb_proyek p ON p.id_proyek = t.id_proyek
    LEFT JOIN tb_user u ON u.id_user = t.assigned_to
    WHERE t.assigned_to = $1
      AND t.status != 'done'
      AND t.timeline_start IS NOT NULL AND t.timeline_end IS NOT NULL
      AND t.timeline_start <= $3 AND t.timeline_end >= $2
  `;
  if (excludeTaskId) {
    params.push(excludeTaskId);
    sql += ` AND t.id_tugas != $${params.length}`;
  }
  const res = await query(sql, params);
  return res.rows as Record<string, unknown>[];
}

export async function createTask(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, name, description, assigned_to, due_date, timeline_start, timeline_end, notes, sort_order, is_survey_task, depends_on } = body;

  if (!project_id || !name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'project_id and name are required' }, { status: 400 });
  }

  try {
    const projectCheck = await query('SELECT id_proyek FROM tb_proyek WHERE id_proyek = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    if (assigned_to) {
      const userCheck = await query('SELECT id_user FROM tb_user WHERE id_user = $1', [assigned_to]);
      if (userCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Assigned user not found' }, { status: 400 });
      }
    }

    // Validate depends_on: must be a task in the same project
    if (depends_on != null) {
      const depCheck = await query('SELECT id_proyek AS project_id FROM tb_tugas WHERE id_tugas = $1', [depends_on]);
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
        'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tb_tugas WHERE id_proyek = $1', [project_id]
      );
      taskSortOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;
    }
    const result = await query(
      `INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date,
         timeline_start, timeline_end, notes, sort_order, is_survey_task, depends_on, created_by)
       VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12)
       ${TUGAS_RETURNING}`,
      [project_id, name.trim(), description || null, assigned_to || null,
       due_date || null, timeline_start || null, timeline_end || null,
       notes || null, taskSortOrder, is_survey_task || false,
       depends_on || null, auth.user.userId]
    );
    await recalculateSPI(parseInt(project_id));
    if (assigned_to) {
      const projRow = await query('SELECT nama_proyek AS name FROM tb_proyek WHERE id_proyek = $1', [project_id]);
      const projectName = (projRow.rows[0]?.name as string) ?? 'Proyek';
      await createNotification({
        userId: parseInt(String(assigned_to)),
        type: 'task_assigned',
        title: `Tugas baru ditugaskan: ${name.trim()}`,
        body: `Kamu mendapat tugas baru di proyek ${projectName}`,
        entityType: 'task',
        entityId: result.rows[0].id as number,
        projectId: parseInt(String(project_id)),
      });
    }
    const actorName1 = ((await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, tasks: taskList } = body;
  if (!project_id || !Array.isArray(taskList) || taskList.length === 0) {
    return NextResponse.json({ success: false, error: 'project_id and tasks array are required' }, { status: 400 });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const projectCheck = await client.query('SELECT id_proyek FROM tb_proyek WHERE id_proyek = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const maxOrder = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tb_tugas WHERE id_proyek = $1', [project_id]
    );
    let nextOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;
    const created = [];
    for (const task of taskList) {
      if (!task.name || typeof task.name !== 'string' || task.name.trim().length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'Each task must have a name' }, { status: 400 });
      }
      const result = await client.query(
        `INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date,
           timeline_start, timeline_end, notes, sort_order, is_survey_task, created_by)
         VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11)
         RETURNING id_tugas AS id, id_proyek AS project_id, nama_tugas AS name, description, assigned_to,
           status, due_date, timeline_start, timeline_end, notes, sort_order, is_survey_task,
           time_spent_seconds, estimated_hours, depends_on, status_changed_at, created_by, created_at, updated_at`,
        [project_id, task.name.trim(), task.description || null, task.assigned_to || null,
         task.due_date || null, task.timeline_start || null, task.timeline_end || null,
         task.notes || null, nextOrder++, task.is_survey_task || false, auth.user.userId]
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
      `SELECT ${TUGAS_COLS}, u.nama AS assigned_to_name, creator.nama AS created_by_name,
        p.nama_proyek AS project_name,
        dep.nama_tugas AS depends_on_name,
        (SELECT COUNT(*)::int FROM task_activities WHERE task_id = t.id_tugas) AS activity_count
       FROM tb_tugas t
       LEFT JOIN tb_user u ON u.id_user = t.assigned_to
       LEFT JOIN tb_user creator ON creator.id_user = t.created_by
       LEFT JOIN tb_proyek p ON p.id_proyek = t.id_proyek
       LEFT JOIN tb_tugas dep ON dep.id_tugas = t.depends_on
       WHERE t.id_tugas = $1`,
      [taskId]
    );
    if (taskResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const task = taskResult.rows[0] as Record<string, unknown>;
    if (auth.user.role === 'teknisi' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    const evidenceResult = await query(
      `SELECT te.id_bukti AS id, te.id_tugas AS task_id, te.file_path, te.file_name, te.file_type,
         te.file_size, te.description, te.uploaded_by, te.uploaded_at, u.nama AS uploaded_by_name
       FROM tb_bukti te
       LEFT JOIN tb_user u ON u.id_user = te.uploaded_by
       WHERE te.id_tugas = $1 ORDER BY te.uploaded_at DESC`,
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const current = await query(
      `SELECT id_tugas AS id, id_proyek AS project_id, nama_tugas AS name, description, assigned_to,
         status, due_date, timeline_start, timeline_end, notes, sort_order, is_survey_task,
         time_spent_seconds, estimated_hours, depends_on, status_changed_at, created_by, created_at, updated_at
       FROM tb_tugas WHERE id_tugas = $1`,
      [taskId]
    );
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;
    const body = await request.json();
    const { name, description, assigned_to, status, due_date, timeline_start, timeline_end, notes, sort_order, is_survey_task, depends_on } = body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    // Validate depends_on
    const newDependsOn = depends_on !== undefined ? depends_on : row.depends_on;
    if (newDependsOn != null) {
      const depCheck = await query('SELECT id_proyek AS project_id FROM tb_tugas WHERE id_tugas = $1', [newDependsOn]);
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

    const newStatus = status !== undefined ? status : (row.status as string);
    const oldStatus = row.status as string;
    const statusChanged = newStatus !== oldStatus;
    const wasActive = ACTIVE_STATUSES.has(oldStatus);
    const accumulateTime = statusChanged && wasActive;

    const result = await query(
      `UPDATE tb_tugas SET nama_tugas=$1, description=$2, assigned_to=$3, status=$4, due_date=$5,
        timeline_start=$6, timeline_end=$7, notes=$8, sort_order=$9,
        is_survey_task=$10, depends_on=$11,
        status_changed_at = CASE WHEN $13::boolean THEN NOW() ELSE status_changed_at END,
        time_spent_seconds = CASE
          WHEN $14::boolean
            THEN COALESCE(time_spent_seconds, 0)
                 + GREATEST(EXTRACT(EPOCH FROM (NOW() - status_changed_at))::int, 0)
          ELSE time_spent_seconds
        END,
        updated_at=NOW()
       WHERE id_tugas=$12
       ${TUGAS_RETURNING}`,
      [
        name !== undefined ? name : row.name,
        description !== undefined ? description : row.description,
        (assigned_to !== undefined ? assigned_to : row.assigned_to) || null,
        newStatus,
        (due_date !== undefined ? due_date : row.due_date) || null,
        newStart || null,
        newEnd || null,
        (notes !== undefined ? notes : row.notes) || null,
        sort_order !== undefined ? sort_order : row.sort_order,
        is_survey_task !== undefined ? is_survey_task : row.is_survey_task,
        newDependsOn || null,
        taskId,
        statusChanged,
        accumulateTime,
      ]
    );

    if (statusChanged) {
      await recalculateSPI(row.project_id as number);
      const updatedRow = result.rows[0] as Record<string, unknown>;
      const activityType = activityTypeForTransition(oldStatus, newStatus);
      const newSeconds = Number(updatedRow.time_spent_seconds ?? 0);
      let activityMessage = `Status: ${oldStatus} -> ${newStatus}`;
      if (accumulateTime) {
        const minutes = Math.round(newSeconds / 60);
        activityMessage += ` (total ${minutes} min)`;
      }
      await query(
        'INSERT INTO task_activities (task_id, user_id, message, activity_type) VALUES ($1, $2, $3, $4)',
        [taskId, auth.user.userId, activityMessage, activityType]
      );
    }

    if (assigned_to != null && assigned_to !== row.assigned_to) {
      const projRow = await query('SELECT nama_proyek AS name FROM tb_proyek WHERE id_proyek = $1', [row.project_id]);
      const projectName = (projRow.rows[0]?.name as string) ?? 'Proyek';
      const taskName = (name !== undefined ? name : row.name) as string;
      await createNotification({
        userId: parseInt(String(assigned_to)),
        type: 'task_assigned',
        title: `Tugas ditugaskan kepadamu: ${taskName}`,
        body: `Kamu ditugaskan ke tugas ini di proyek ${projectName}`,
        entityType: 'task',
        entityId: taskId,
        projectId: row.project_id as number,
      });
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
      const actorName2 = ((await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const task = await query('SELECT id_proyek AS project_id, nama_tugas AS name FROM tb_tugas WHERE id_tugas = $1', [taskId]);
    if (task.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const taskRow = task.rows[0] as Record<string, unknown>;
    const projectId = taskRow.project_id as number;
    const actorName3 = ((await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
    await logChange({
      entityType: 'task', entityId: taskId, entityName: taskRow.name as string,
      action: 'delete', changes: [{ field: '*', oldValue: taskRow.name as string, newValue: null }],
      userId: auth.user.userId, userName: actorName3,
    });
    await query('DELETE FROM tb_tugas WHERE id_tugas = $1', [taskId]);
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
    const current = await query(
      `SELECT id_tugas AS id, id_proyek AS project_id, nama_tugas AS name, status, assigned_to,
         is_survey_task, depends_on, time_spent_seconds, status_changed_at
       FROM tb_tugas WHERE id_tugas = $1`,
      [taskId]
    );
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const task = current.rows[0] as Record<string, unknown>;
    const currentStatus = task.status as string;

    // No-op jika status sama -> balas tanpa cek transisi/peran (drag ke kolom yang sama).
    if (currentStatus === status) {
      return NextResponse.json({ success: true, data: task });
    }

    if (auth.user.role === 'teknisi') {
      if (task.assigned_to !== auth.user.userId) {
        return NextResponse.json({ success: false, error: 'You can only change status of tasks assigned to you' }, { status: 403 });
      }
      // Block non-survey tasks when project is in survey phase
      const projPhase = await query('SELECT phase FROM tb_proyek WHERE id_proyek = $1', [task.project_id]);
      if (projPhase.rowCount !== 0) {
        const phase = (projPhase.rows[0] as { phase: string }).phase;
        if (phase === 'survey' && !task.is_survey_task) {
          return NextResponse.json({
            success: false,
            error: 'Tugas ini bukan bagian dari survei. Selesaikan survei terlebih dahulu sebelum mengerjakan tugas proyek.',
          }, { status: 400 });
        }
      }
      const allowed = STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json({
          success: false,
          error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`,
        }, { status: 400 });
      }
    } else if (!roleSatisfies(auth.user.role, ROLES.MANAJER)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Dependency check: if this task depends on another and that task is not done, block status change
    if (task.depends_on != null) {
      const dep = await query('SELECT status, nama_tugas AS name FROM tb_tugas WHERE id_tugas = $1', [task.depends_on]);
      if (dep.rowCount !== 0 && (dep.rows[0] as { status: string }).status !== 'done') {
        const depName = (dep.rows[0] as { name: string }).name;
        return NextResponse.json({
          success: false,
          error: `Tugas ini bergantung pada tugas lain yang belum selesai: "${depName}"`,
        }, { status: 400 });
      }
    }

    const wasActive = ACTIVE_STATUSES.has(currentStatus);
    const result = await query(
      wasActive
        ? `UPDATE tb_tugas
             SET status = $1,
                 time_spent_seconds = COALESCE(time_spent_seconds, 0)
                                    + GREATEST(EXTRACT(EPOCH FROM (NOW() - status_changed_at))::int, 0),
                 status_changed_at = NOW(),
                 updated_at = NOW()
           WHERE id_tugas = $2 ${TUGAS_RETURNING}`
        : `UPDATE tb_tugas
             SET status = $1,
                 status_changed_at = NOW(),
                 updated_at = NOW()
           WHERE id_tugas = $2 ${TUGAS_RETURNING}`,
      [status, taskId]
    );

    await recalculateSPI(task.project_id as number);

    const activityType = activityTypeForTransition(currentStatus, status);
    const updatedRow = result.rows[0] as Record<string, unknown>;
    const newSeconds = Number(updatedRow.time_spent_seconds ?? 0);
    let activityMessage = `Status: ${currentStatus} -> ${status}`;
    if (wasActive) {
      const minutes = Math.round(newSeconds / 60);
      activityMessage += ` (total ${minutes} min)`;
    }
    await query(
      'INSERT INTO task_activities (task_id, user_id, message, activity_type) VALUES ($1, $2, $3, $4)',
      [taskId, auth.user.userId, activityMessage, activityType]
    );

    const actorName4 = ((await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string) || 'Unknown';
    await logChange({
      entityType: 'task', entityId: taskId, entityName: task.name as string,
      action: 'update', changes: [{ field: 'status', oldValue: currentStatus, newValue: status }],
      userId: auth.user.userId, userName: actorName4,
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Change task status error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function reorderTask(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
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
      `UPDATE tb_tugas SET sort_order=$1, updated_at=NOW() WHERE id_tugas=$2 ${TUGAS_RETURNING}`,
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
      SELECT ${TUGAS_COLS}, u.nama AS assigned_to_name, creator.nama AS created_by_name,
        dep.nama_tugas AS depends_on_name,
        COUNT(te.id_bukti)::int AS evidence_count
      FROM tb_tugas t
      LEFT JOIN tb_user u ON u.id_user = t.assigned_to
      LEFT JOIN tb_user creator ON creator.id_user = t.created_by
      LEFT JOIN tb_tugas dep ON dep.id_tugas = t.depends_on
      LEFT JOIN tb_bukti te ON te.id_tugas = t.id_tugas
      WHERE t.id_proyek = $1
    `;
    const sqlParams: unknown[] = [id];
    if (auth.user.role === 'teknisi') {
      sql += ' AND t.assigned_to = $2';
      sqlParams.push(auth.user.userId);
    }
    sql += ' GROUP BY t.id_tugas, u.nama, creator.nama, dep.nama_tugas ORDER BY t.sort_order ASC, t.created_at ASC';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT t.id_tugas AS id, t.nama_tugas AS name, t.status, t.due_date, t.timeline_start, t.timeline_end,
              t.assigned_to, t.time_spent_seconds, t.sort_order, t.depends_on,
              u.nama AS assigned_to_name,
              p.id_proyek AS project_id, p.project_code, p.nama_proyek AS project_name,
              p.start_date AS project_start, p.end_date AS project_end,
              p.category AS project_category, p.status AS project_status,
              ph.status AS health_status
       FROM tb_tugas t
       JOIN tb_proyek p ON p.id_proyek = t.id_proyek
       LEFT JOIN tb_user u ON u.id_user = t.assigned_to
       LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
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
