import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/budget/project/:projectId - List budget items (planned + actual)
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
      `SELECT * FROM budget_items
       WHERE project_id = $1
       ORDER BY is_actual ASC, category ASC, created_at ASC`,
      [projectId]
    );

    const summaryResult = await query<{ planned_total: string; actual_total: string }>(
      `SELECT
        COALESCE(SUM(amount) FILTER (WHERE is_actual = false), 0)::numeric AS planned_total,
        COALESCE(SUM(amount) FILTER (WHERE is_actual = true), 0)::numeric AS actual_total
      FROM budget_items
      WHERE project_id = $1`,
      [projectId]
    );

    const categoryResult = await query(
      `SELECT
        category,
        COALESCE(SUM(amount) FILTER (WHERE is_actual = false), 0)::numeric AS planned,
        COALESCE(SUM(amount) FILTER (WHERE is_actual = true), 0)::numeric AS actual
      FROM budget_items
      WHERE project_id = $1
      GROUP BY category
      ORDER BY category ASC`,
      [projectId]
    );

    const summary = summaryResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        items: result.rows,
        summary: {
          planned_total: parseFloat(String(summary.planned_total)) || 0,
          actual_total: parseFloat(String(summary.actual_total)) || 0,
          variance: (parseFloat(String(summary.planned_total)) || 0) - (parseFloat(String(summary.actual_total)) || 0),
          by_category: categoryResult.rows,
        },
      },
    });
  } catch (err) {
    console.error('Get budget items error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
