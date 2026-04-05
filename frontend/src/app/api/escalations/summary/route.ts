import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/escalations/summary
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const userId = auth.user.userId;
    const role = auth.user.role;

    let result;
    if (role === 'technician') {
      result = await query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'open')::int AS open,
          COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
          COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
          COUNT(*)::int AS total
        FROM escalations WHERE reported_by = $1`,
        [userId]
      );
    } else {
      result = await query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'open')::int AS open,
          COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
          COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
          COUNT(*)::int AS total
        FROM escalations`
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Escalation summary error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
