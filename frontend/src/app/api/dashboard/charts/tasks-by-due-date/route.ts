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
        TO_CHAR(t.due_date, 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_on_it,
        COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.due_date IS NOT NULL AND p.status = 'active'
      GROUP BY TO_CHAR(t.due_date, 'YYYY-MM')
      ORDER BY month ASC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Tasks by due date chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
