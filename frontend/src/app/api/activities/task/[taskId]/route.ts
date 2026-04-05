import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/activities/task/:taskId - List activities for a task
export async function GET(
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
    // Technician: verify assigned
    if (auth.user.role === 'technician') {
      const taskCheck = await query<{ assigned_to: number }>(
        'SELECT assigned_to FROM tasks WHERE id = $1',
        [taskId]
      );
      if (taskCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }
      if (taskCheck.rows[0].assigned_to !== auth.user.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }
    }

    const result = await query(
      `SELECT a.*, u.name AS user_name
       FROM task_activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.task_id = $1
       ORDER BY a.created_at ASC`,
      [taskId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get activities error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
