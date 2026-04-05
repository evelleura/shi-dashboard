import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

const VALID_STATUSES = ['to_do', 'in_progress', 'working_on_it', 'review', 'done'];

// GET /api/tasks/:id - Get single task with evidence
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const taskResult = await query(
      `SELECT t.*,
        u.name AS assigned_to_name,
        creator.name AS created_by_name,
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
      `SELECT te.*, u.name AS uploaded_by_name
       FROM task_evidence te
       LEFT JOIN users u ON u.id = te.uploaded_by
       WHERE te.task_id = $1
       ORDER BY te.uploaded_at DESC`,
      [taskId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        evidence: evidenceResult.rows,
      },
    });
  } catch (err) {
    console.error('Get task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/tasks/:id - Update task (manager/admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const {
      name, description, assigned_to, status, due_date,
      timeline_start, timeline_end, notes, budget, sort_order, is_survey_task,
    } = body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updatedName = name !== undefined ? name : row.name;
    const updatedDesc = description !== undefined ? description : row.description;
    const updatedAssigned = assigned_to !== undefined ? assigned_to : row.assigned_to;
    const updatedStatus = status !== undefined ? status : row.status;
    const updatedDueDate = due_date !== undefined ? due_date : row.due_date;
    const updatedTimelineStart = timeline_start !== undefined ? timeline_start : row.timeline_start;
    const updatedTimelineEnd = timeline_end !== undefined ? timeline_end : row.timeline_end;
    const updatedNotes = notes !== undefined ? notes : row.notes;
    const updatedBudget = budget !== undefined ? budget : row.budget;
    const updatedSortOrder = sort_order !== undefined ? sort_order : row.sort_order;
    const updatedIsSurvey = is_survey_task !== undefined ? is_survey_task : row.is_survey_task;

    const result = await query(
      `UPDATE tasks SET
        name = $1, description = $2, assigned_to = $3, status = $4,
        due_date = $5, timeline_start = $6, timeline_end = $7, notes = $8,
        budget = $9, sort_order = $10, is_survey_task = $11, updated_at = NOW()
      WHERE id = $12
      RETURNING *`,
      [
        updatedName, updatedDesc, updatedAssigned || null, updatedStatus,
        updatedDueDate || null, updatedTimelineStart || null, updatedTimelineEnd || null,
        updatedNotes || null, updatedBudget, updatedSortOrder, updatedIsSurvey, taskId,
      ]
    );

    const oldStatus = row.status;
    if (status !== undefined && status !== oldStatus) {
      await recalculateSPI(row.project_id as number);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete task (manager/admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
