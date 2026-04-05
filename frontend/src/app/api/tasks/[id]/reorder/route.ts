import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/tasks/:id/reorder
export async function POST(
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

  const body = await request.json();
  const { sort_order } = body;

  if (sort_order === undefined || typeof sort_order !== 'number' || sort_order < 0) {
    return NextResponse.json(
      { success: false, error: 'sort_order must be a non-negative number' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `UPDATE tasks SET sort_order = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
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
