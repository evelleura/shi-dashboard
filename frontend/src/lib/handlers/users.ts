import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

export async function listUsers(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY name ASC');
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getMe(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [auth.user.userId]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get me error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getMyProjects(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['technician']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.start_date, p.end_date, p.status,
              p.phase, p.project_value,
              ph.spi_value, ph.status AS health_status,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1)::int AS my_task_count,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::int AS my_completed_tasks,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status IN ('working_on_it', 'in_progress'))::int AS my_working_tasks,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS my_overtime_tasks,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.due_date < CURRENT_DATE AND t.status NOT IN ('done'))::int AS my_overdue_tasks
       FROM projects p
       JOIN project_assignments pa ON pa.project_id = p.id
       LEFT JOIN project_health ph ON ph.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE pa.user_id = $1 AND p.status = 'active'
       GROUP BY p.id, p.name, p.description, p.start_date, p.end_date, p.status,
                p.phase, p.project_value, ph.spi_value, ph.status
       ORDER BY p.end_date ASC`,
      [auth.user.userId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get my projects error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function listTechnicians(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      "SELECT id, name, email FROM users WHERE role = 'technician' ORDER BY name ASC"
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get technicians error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
