import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logChange } from './audit';

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

export async function updateMe(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const body = await request.json();
  const { name, email } = body;

  try {
    const current = await query('SELECT name, email FROM users WHERE id = $1', [auth.user.userId]);
    if (current.rowCount === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    const row = current.rows[0] as Record<string, unknown>;

    const newName = name !== undefined ? name : row.name;
    const newEmail = email !== undefined ? email : row.email;

    if (newEmail !== row.email) {
      const dup = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, auth.user.userId]);
      if (dup.rowCount && dup.rowCount > 0) return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
    }

    const result = await query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role, created_at',
      [newName, newEmail, auth.user.userId]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update me error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function changeMyPassword(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const body = await request.json();
  const { current_password, new_password } = body;

  if (!current_password || !new_password) return NextResponse.json({ success: false, error: 'Both fields required' }, { status: 400 });
  if (new_password.length < 6) return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });

  try {
    const result = await query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [auth.user.userId]);
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const valid = bcrypt.compareSync(current_password, (result.rows[0] as Record<string, unknown>).password_hash as string);
    if (!valid) return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });

    const hash = bcrypt.hashSync(new_password, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, auth.user.userId]);
    return NextResponse.json({ success: true, message: 'Password changed' });
  } catch (err) {
    console.error('Change password error:', err);
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

export async function createUser(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ success: false, error: 'name, email, password, and role are required' }, { status: 400 });
  }
  const allowedRoles = ['technician', 'manager', 'admin'];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ success: false, error: 'role must be one of: technician, manager, admin' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ success: false, error: 'password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rowCount && emailCheck.rowCount > 0) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, role, passwordHash]
    );
    const newUser = result.rows[0] as { id: number; name: string };
    const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'user',
      entityId: newUser.id,
      entityName: newUser.name,
      action: 'create',
      changes: [{ field: '*', oldValue: null, newValue: newUser.name }],
      userId: auth.user.userId,
      userName: actorName,
    });
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create user error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateUser(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, email, role } = body;

  const allowedRoles = ['technician', 'manager', 'admin'];
  if (role !== undefined && !allowedRoles.includes(role)) {
    return NextResponse.json({ success: false, error: 'role must be one of: technician, manager, admin' }, { status: 400 });
  }

  try {
    const current = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;

    if (email !== undefined && email !== row.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailCheck.rowCount && emailCheck.rowCount > 0) {
        return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
      }
    }

    const result = await query(
      'UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4 RETURNING id, name, email, role, created_at',
      [
        name !== undefined ? name : row.name,
        email !== undefined ? email : row.email,
        role !== undefined ? role : row.role,
        userId,
      ]
    );
    const updated = result.rows[0] as Record<string, unknown>;
    const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    const auditFields = ['name', 'email', 'role'];
    const changes = auditFields
      .filter(f => String(updated[f] ?? '') !== String(row[f] ?? ''))
      .map(f => ({ field: f, oldValue: String(row[f] ?? ''), newValue: String(updated[f] ?? '') }));
    if (changes.length > 0) {
      await logChange({
        entityType: 'user',
        entityId: userId,
        entityName: String(updated.name),
        action: 'update',
        changes,
        userId: auth.user.userId,
        userName: actorName,
      });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update user error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function resetUserPassword(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
  }

  const body = await request.json();
  const { password } = body;

  if (!password || password.length < 6) {
    return NextResponse.json({ success: false, error: 'password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const current = await query('SELECT id, name FROM users WHERE id = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as { id: number; name: string };

    const passwordHash = bcrypt.hashSync(password, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

    const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'user',
      entityId: userId,
      entityName: row.name,
      action: 'password_reset',
      changes: [{ field: 'password', oldValue: '***', newValue: '***' }],
      userId: auth.user.userId,
      userName: actorName,
    });
    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteUser(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
  }
  if (userId === auth.user.userId) {
    return NextResponse.json({ success: false, error: 'Cannot delete yourself' }, { status: 400 });
  }

  try {
    const current = await query('SELECT id, name FROM users WHERE id = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as { id: number; name: string };

    await query('DELETE FROM users WHERE id = $1', [userId]);

    const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'user',
      entityId: userId,
      entityName: row.name,
      action: 'delete',
      changes: [{ field: '*', oldValue: row.name, newValue: null }],
      userId: auth.user.userId,
      userName: actorName,
    });
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
