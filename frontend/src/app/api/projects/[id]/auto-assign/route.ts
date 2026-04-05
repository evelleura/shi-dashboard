import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { getClient } from '@/lib/db';

// POST /api/projects/:id/auto-assign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    return NextResponse.json(
      { success: false, error: 'user_ids array is required and must not be empty' },
      { status: 400 }
    );
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const unassigned = await client.query(
      `SELECT id FROM tasks WHERE project_id = $1 AND assigned_to IS NULL ORDER BY sort_order ASC`,
      [projectId]
    );

    if (unassigned.rowCount === 0) {
      await client.query('COMMIT');
      return NextResponse.json({
        success: true,
        data: { assigned_count: 0 },
        message: 'No unassigned tasks found',
      });
    }

    let assignedCount = 0;
    for (let i = 0; i < unassigned.rows.length; i++) {
      const taskId = (unassigned.rows[i] as { id: number }).id;
      const userId = user_ids[i % user_ids.length];
      await client.query(
        'UPDATE tasks SET assigned_to = $1, updated_at = NOW() WHERE id = $2',
        [userId, taskId]
      );
      assignedCount++;
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: { assigned_count: assignedCount },
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
