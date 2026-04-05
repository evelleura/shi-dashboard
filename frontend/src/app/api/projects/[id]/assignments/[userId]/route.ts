import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// DELETE /api/projects/:id/assignments/:userId - Unassign technician
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  const userIdNum = parseInt(userId);

  if (isNaN(projectId) || isNaN(userIdNum)) {
    return NextResponse.json({ success: false, error: 'Invalid project or user ID' }, { status: 400 });
  }

  try {
    const result = await query(
      'DELETE FROM project_assignments WHERE project_id = $1 AND user_id = $2 RETURNING project_id',
      [projectId, userIdNum]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Technician unassigned successfully' });
  } catch (err) {
    console.error('Unassign technician error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
