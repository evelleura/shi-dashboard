import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/evidence/task/:taskId - List evidence for a task
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
    const result = await query(
      `SELECT te.*, u.name AS uploaded_by_name
       FROM task_evidence te
       LEFT JOIN users u ON u.id = te.uploaded_by
       WHERE te.task_id = $1
       ORDER BY te.uploaded_at DESC`,
      [taskId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get evidence error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
