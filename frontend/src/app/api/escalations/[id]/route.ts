import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/escalations/:id - Single escalation detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) {
    return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT e.*,
        ur.name AS reporter_name,
        uv.name AS resolver_name,
        t.name AS task_name,
        p.name AS project_name
      FROM escalations e
      LEFT JOIN users ur ON ur.id = e.reported_by
      LEFT JOIN users uv ON uv.id = e.resolved_by
      LEFT JOIN tasks t ON t.id = e.task_id
      LEFT JOIN projects p ON p.id = e.project_id
      WHERE e.id = $1`,
      [escalationId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    }

    const escalation = result.rows[0] as Record<string, unknown>;

    if (auth.user.role === 'technician' && escalation.reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: escalation });
  } catch (err) {
    console.error('Get escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
