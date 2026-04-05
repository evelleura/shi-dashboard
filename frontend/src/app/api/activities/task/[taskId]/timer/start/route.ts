import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

// POST /api/activities/task/:taskId/timer/start
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId: taskIdStr } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const taskId = parseInt(taskIdStr);
  if (isNaN(taskId)) {
    return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const taskResult = await query<{
      id: number; project_id: number; assigned_to: number;
      status: string; is_tracking: boolean; time_spent_seconds: number;
    }>(
      'SELECT id, project_id, assigned_to, status, is_tracking, time_spent_seconds FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult.rows[0];

    if (auth.user.role === 'technician' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only start timer on tasks assigned to you' },
        { status: 403 }
      );
    }

    if (task.status === 'review' || task.status === 'done') {
      return NextResponse.json(
        { success: false, error: 'Cannot start timer on reviewed/done task' },
        { status: 400 }
      );
    }

    if (task.is_tracking) {
      return NextResponse.json(
        { success: false, error: 'Timer is already running on this task' },
        { status: 409 }
      );
    }

    // Stop any currently tracking task for this user
    const currentlyTracking = await query<{ id: number; timer_started_at: Date; project_id: number }>(
      `SELECT id, timer_started_at, project_id FROM tasks
       WHERE assigned_to = $1 AND is_tracking = true AND id != $2`,
      [auth.user.userId, taskId]
    );

    for (const running of currentlyTracking.rows) {
      await query(
        `UPDATE tasks SET
          is_tracking = false,
          time_spent_seconds = time_spent_seconds + EXTRACT(EPOCH FROM (NOW() - timer_started_at))::int,
          timer_started_at = NULL,
          status = 'in_progress',
          updated_at = NOW()
        WHERE id = $1`,
        [running.id]
      );
      const stoppedTask = await query<{ time_spent_seconds: number }>(
        'SELECT time_spent_seconds FROM tasks WHERE id = $1', [running.id]
      );
      const stoppedMins = Math.round((stoppedTask.rows[0]?.time_spent_seconds ?? 0) / 60);
      await query(
        `INSERT INTO task_activities (task_id, user_id, message, activity_type)
         VALUES ($1, $2, $3, 'pause')`,
        [running.id, auth.user.userId, `Auto-paused (switched task, ${stoppedMins} min total)`]
      );
    }

    const activityType = task.time_spent_seconds > 0 ? 'resume' : 'start_work';
    const activityMessage = task.time_spent_seconds > 0 ? 'Resumed working' : 'Started working';

    const newStatus = (task.status === 'to_do' || task.status === 'in_progress') ? 'working_on_it' : task.status;

    const updateResult = await query(
      `UPDATE tasks SET
        is_tracking = true,
        timer_started_at = NOW(),
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *`,
      [newStatus, taskId]
    );

    await query(
      `INSERT INTO task_activities (task_id, user_id, message, activity_type)
       VALUES ($1, $2, $3, $4)`,
      [taskId, auth.user.userId, activityMessage, activityType]
    );

    if (task.status !== newStatus) {
      await recalculateSPI(task.project_id);
    }

    return NextResponse.json({ success: true, data: updateResult.rows[0] });
  } catch (err) {
    console.error('Start timer error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
