import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// PATCH /api/escalations/:id/review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) {
    return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });
  }

  try {
    const check = await query('SELECT id, status FROM escalations WHERE id = $1', [escalationId]);
    if (check.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    }

    const current = check.rows[0] as Record<string, unknown>;
    if (current.status === 'resolved') {
      return NextResponse.json({ success: false, error: 'Escalation is already resolved' }, { status: 409 });
    }

    const result = await query(
      `UPDATE escalations SET status = 'in_review', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [escalationId]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Review escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
