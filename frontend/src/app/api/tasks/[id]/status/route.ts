import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

const VALID_STATUSES = ['to_do', 'in_progress', 'working_on_it', 'review', 'done'];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  to_do: ['in_progress'],
  in_progress: ['to_do', 'review'],
  working_on_it: ['in_progress'],
  review: ['in_progress'],
  done: [],
};

const MANAGER_OVERRIDE_ROLES = ['manager', 'admin'];

// PATCH /api/tasks/:id/status - Change task status
export async function PATCH(
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

  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const current = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const task = current.rows[0] as Record<string, unknown>;
    const currentStatus = task.status as string;

    // Technician: must be assigned
    if (auth.user.role === 'technician') {
      if (task.assigned_to !== auth.user.userId) {
        return NextResponse.json(
          { success: false, error: 'You can only change status of tasks assigned to you' },
          { status: 403 }
        );
      }

      const allowed = STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`,
          },
          { status: 400 }
        );
      }
    }

    // Non-technician, non-manager/admin: deny
    if (!MANAGER_OVERRIDE_ROLES.includes(auth.user.role) && auth.user.role !== 'technician') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const result = await query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, taskId]
    );

    if (currentStatus !== status) {
      await recalculateSPI(task.project_id as number);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Change task status error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
