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
        p.name,
        COALESCE(SUM(b.amount) FILTER (WHERE b.is_actual = false), 0)::numeric AS planned,
        COALESCE(SUM(b.amount) FILTER (WHERE b.is_actual = true), 0)::numeric AS actual
      FROM projects p
      LEFT JOIN budget_items b ON b.project_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.id, p.name
      HAVING SUM(b.amount) > 0
      ORDER BY p.name ASC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Budget status chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
