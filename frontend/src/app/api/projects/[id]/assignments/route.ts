import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/projects/:id/assignments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, pa.assigned_at
       FROM project_assignments pa
       JOIN users u ON u.id = pa.user_id
       WHERE pa.project_id = $1`,
      [projectId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get assignments error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/:id/assignments - Assign technician
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  const body = await request.json();
  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
  }

  try {
    const userCheck = await query("SELECT id, role FROM users WHERE id = $1", [user_id]);
    if (userCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 400 });
    }

    await query(
      `INSERT INTO project_assignments (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [projectId, user_id]
    );

    return NextResponse.json(
      { success: true, message: 'Technician assigned successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('Assign technician error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
