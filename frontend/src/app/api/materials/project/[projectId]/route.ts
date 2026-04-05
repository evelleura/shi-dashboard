import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/materials/project/:projectId - List materials for a project
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
    const result = await query(
      `SELECT * FROM materials
       WHERE project_id = $1
       ORDER BY created_at ASC`,
      [projectId]
    );

    const totals = await query<{ total_items: string; total_cost: string }>(
      `SELECT
        COUNT(*)::int AS total_items,
        COALESCE(SUM(total_price), 0)::numeric AS total_cost
      FROM materials
      WHERE project_id = $1`,
      [projectId]
    );

    return NextResponse.json({
      success: true,
      data: {
        materials: result.rows,
        total_items: parseInt(String(totals.rows[0].total_items)) || 0,
        total_cost: parseFloat(String(totals.rows[0].total_cost)) || 0,
      },
    });
  } catch (err) {
    console.error('Get materials error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
