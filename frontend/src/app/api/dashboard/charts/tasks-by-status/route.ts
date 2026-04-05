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
        t.status,
        COUNT(*)::int AS count
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.status = 'active'
      GROUP BY t.status
      ORDER BY
        CASE t.status WHEN 'done' THEN 1 WHEN 'review' THEN 2 WHEN 'working_on_it' THEN 3 WHEN 'in_progress' THEN 4 WHEN 'to_do' THEN 5 END`
    );

    const total = result.rows.reduce((sum, r) => sum + parseInt(String((r as Record<string, unknown>).count)), 0);

    const data = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      const count = parseInt(String(row.count));
      return {
        status: row.status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Tasks by status chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
