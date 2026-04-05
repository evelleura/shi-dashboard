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
        p.id AS project_id,
        p.name AS project_name,
        COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress'))::int AS overdue_working,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS overdue_todo
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.due_date < CURRENT_DATE
        AND t.status NOT IN ('done')
        AND p.status = 'active'
      GROUP BY p.id, p.name
      HAVING COUNT(*) > 0
      ORDER BY COUNT(*) DESC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Overdue tasks chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
