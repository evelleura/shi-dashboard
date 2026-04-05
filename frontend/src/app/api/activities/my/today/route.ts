import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/activities/my/today
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const result = await query(
      `SELECT a.*,
        t.name AS task_name,
        p.name AS project_name
      FROM task_activities a
      JOIN tasks t ON t.id = a.task_id
      JOIN projects p ON p.id = t.project_id
      WHERE a.user_id = $1
        AND a.created_at >= CURRENT_DATE
      ORDER BY a.created_at ASC`,
      [auth.user.userId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get my today activities error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
