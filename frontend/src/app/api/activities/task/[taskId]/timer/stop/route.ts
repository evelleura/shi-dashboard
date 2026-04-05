import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/activities/task/:taskId/timer/stop
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
      is_tracking: boolean; timer_started_at: Date;
    }>(
      'SELECT id, project_id, assigned_to, is_tracking, timer_started_at FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult.rows[0];

    if (auth.user.role === 'technician' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only stop timer on tasks assigned to you' },
        { status: 403 }
      );
    }

    if (!task.is_tracking) {
      return NextResponse.json(
        { success: false, error: 'Timer is not running on this task' },
        { status: 409 }
      );
    }

    const updateResult = await query(
      `UPDATE tasks SET
        is_tracking = false,
        time_spent_seconds = time_spent_seconds + EXTRACT(EPOCH FROM (NOW() - timer_started_at))::int,
        timer_started_at = NULL,
        status = 'in_progress',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [taskId]
    );

    const updatedTask = updateResult.rows[0] as Record<string, unknown>;
    const totalSeconds = updatedTask.time_spent_seconds as number;
    const minutes = Math.round(totalSeconds / 60);

    await query(
      `INSERT INTO task_activities (task_id, user_id, message, activity_type)
       VALUES ($1, $2, $3, $4)`,
      [taskId, auth.user.userId, `Paused work (${minutes} min total)`, 'pause']
    );

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (err) {
    console.error('Stop timer error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
