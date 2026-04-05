import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/projects/:id/approve-survey
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
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const current = await query('SELECT phase, survey_approved FROM projects WHERE id = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const project = current.rows[0] as { phase: string; survey_approved: boolean };

    if (project.phase !== 'survey') {
      return NextResponse.json({ success: false, error: 'Project is not in survey phase' }, { status: 400 });
    }

    if (project.survey_approved) {
      return NextResponse.json({ success: false, error: 'Survey already approved' }, { status: 400 });
    }

    const result = await query(
      `UPDATE projects SET
        phase = 'execution',
        survey_approved = TRUE,
        survey_approved_by = $1,
        survey_approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING *`,
      [auth.user.userId, projectId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Survey approved. Project moved to execution phase.',
    });
  } catch (err) {
    console.error('Approve survey error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
