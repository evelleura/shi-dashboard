import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/tasks/project/:projectId - List tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId: projectIdStr } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const projectId = parseInt(projectIdStr);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    let sql = `
      SELECT t.*,
        u.name AS assigned_to_name,
        creator.name AS created_by_name,
        COUNT(te.id)::int AS evidence_count
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users creator ON creator.id = t.created_by
      LEFT JOIN task_evidence te ON te.task_id = t.id
      WHERE t.project_id = $1
    `;
    const sqlParams: unknown[] = [projectId];

    // Technicians only see tasks assigned to them
    if (auth.user.role === 'technician') {
      sql += ` AND t.assigned_to = $2`;
      sqlParams.push(auth.user.userId);
    }

    sql += ` GROUP BY t.id, u.name, creator.name ORDER BY t.sort_order ASC, t.created_at ASC`;

    const result = await query(sql, sqlParams);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get tasks error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
