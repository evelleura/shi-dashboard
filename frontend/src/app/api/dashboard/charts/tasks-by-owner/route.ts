import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT
        u.id AS user_id,
        u.name,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS overtime,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do
      FROM tasks t
      JOIN users u ON u.id = t.assigned_to
      JOIN projects p ON p.id = t.project_id
      WHERE p.status = 'active'
      GROUP BY u.id, u.name
      ORDER BY total DESC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Tasks by owner chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
