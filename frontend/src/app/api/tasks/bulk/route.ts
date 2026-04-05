import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { getClient } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

// POST /api/tasks/bulk - Create multiple tasks
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, tasks: taskList } = body;

  if (!project_id || !Array.isArray(taskList) || taskList.length === 0) {
    return NextResponse.json(
      { success: false, error: 'project_id and tasks array are required' },
      { status: 400 }
    );
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const projectCheck = await client.query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const maxOrder = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tasks WHERE project_id = $1',
      [project_id]
    );
    let nextOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;

    const created = [];
    for (const task of taskList) {
      if (!task.name || typeof task.name !== 'string' || task.name.trim().length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Each task must have a name' },
          { status: 400 }
        );
      }

      const result = await client.query(
        `INSERT INTO tasks
          (project_id, name, description, assigned_to, status, due_date,
           timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, created_by)
         VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          project_id, task.name.trim(), task.description || null, task.assigned_to || null,
          task.due_date || null, task.timeline_start || null, task.timeline_end || null,
          task.notes || null, task.budget || 0, nextOrder++,
          task.is_survey_task || false, auth.user.userId,
        ]
      );
      created.push(result.rows[0]);
    }

    await client.query('COMMIT');

    await recalculateSPI(parseInt(project_id));

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk create tasks error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
