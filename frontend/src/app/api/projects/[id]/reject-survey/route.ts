import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

// POST /api/projects/:id/reject-survey
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
    const current = await query('SELECT phase FROM projects WHERE id = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const project = current.rows[0] as { phase: string };

    if (project.phase !== 'survey') {
      return NextResponse.json({ success: false, error: 'Project is not in survey phase' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body as Record<string, string>).reason;

    await query(
      `UPDATE tasks SET status = 'to_do', updated_at = NOW()
       WHERE project_id = $1 AND is_survey_task = TRUE AND status = 'done'`,
      [projectId]
    );

    await recalculateSPI(projectId);

    return NextResponse.json({
      success: true,
      message: 'Survey rejected. Survey tasks have been reset.',
      data: { reason: reason || 'No reason provided' },
    });
  } catch (err) {
    console.error('Reject survey error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
