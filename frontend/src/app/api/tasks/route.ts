import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

// POST /api/tasks - Create task (manager/admin)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const {
    project_id, name, description, assigned_to, due_date,
    timeline_start, timeline_end, notes, budget, sort_order, is_survey_task,
  } = body;

  if (!project_id || !name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'project_id and name are required' },
      { status: 400 }
    );
  }

  try {
    const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if (assigned_to) {
      const userCheck = await query('SELECT id FROM users WHERE id = $1', [assigned_to]);
      if (userCheck.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Assigned user not found' }, { status: 400 });
      }
    }

    let taskSortOrder = sort_order;
    if (taskSortOrder === undefined || taskSortOrder === null) {
      const maxOrder = await query<{ max_order: string }>(
        'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tasks WHERE project_id = $1',
        [project_id]
      );
      taskSortOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;
    }

    const result = await query(
      `INSERT INTO tasks
        (project_id, name, description, assigned_to, status, due_date,
         timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, created_by)
       VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        project_id, name.trim(), description || null, assigned_to || null,
        due_date || null, timeline_start || null, timeline_end || null,
        notes || null, budget || 0, taskSortOrder, is_survey_task || false,
        auth.user.userId,
      ]
    );

    await recalculateSPI(parseInt(project_id));

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create task error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
