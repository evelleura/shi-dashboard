import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logChange } from './audit';

export async function listUsers(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query('SELECT id_user AS id, nama AS name, email, role, is_active, created_at FROM tb_user ORDER BY nama ASC');
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
      'SELECT id_user AS id, nama AS name, email, role, created_at FROM tb_user WHERE id_user = $1',
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
    const current = await query('SELECT nama AS name, email FROM tb_user WHERE id_user = $1', [auth.user.userId]);
    if (current.rowCount === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    const row = current.rows[0] as Record<string, unknown>;

    const newName = name !== undefined ? name : row.name;
    const newEmail = email !== undefined ? email : row.email;

    if (newEmail !== row.email) {
      const dup = await query('SELECT id_user FROM tb_user WHERE email = $1 AND id_user != $2', [newEmail, auth.user.userId]);
      if (dup.rowCount && dup.rowCount > 0) return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
    }

    const result = await query(
      'UPDATE tb_user SET nama = $1, email = $2 WHERE id_user = $3 RETURNING id_user AS id, nama AS name, email, role, created_at',
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
    const result = await query<{ password_hash: string }>('SELECT password AS password_hash FROM tb_user WHERE id_user = $1', [auth.user.userId]);
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const valid = bcrypt.compareSync(current_password, (result.rows[0] as Record<string, unknown>).password_hash as string);
    if (!valid) return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });

    const hash = bcrypt.hashSync(new_password, 10);
    await query('UPDATE tb_user SET password = $1 WHERE id_user = $2', [hash, auth.user.userId]);
    return NextResponse.json({ success: true, message: 'Password changed' });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getMyProjects(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['teknisi']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT p.id_proyek AS id, p.nama_proyek AS name, p.description, p.start_date, p.end_date, p.status,
              p.phase, p.project_value,
              ph.spi_value, ph.status AS health_status,
              COUNT(t.id_tugas) FILTER (WHERE t.assigned_to = $1)::int AS my_task_count,
              COUNT(t.id_tugas) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::int AS my_completed_tasks,
              COUNT(t.id_tugas) FILTER (WHERE t.assigned_to = $1 AND t.status = 'working_on_it')::int AS my_working_tasks,
              COUNT(t.id_tugas) FILTER (WHERE t.assigned_to = $1 AND t.status = 'working_on_it' AND t.due_date < CURRENT_DATE)::int AS my_overtime_tasks,
              COUNT(t.id_tugas) FILTER (WHERE t.assigned_to = $1 AND t.due_date < CURRENT_DATE AND t.status NOT IN ('done'))::int AS my_overdue_tasks
       FROM tb_proyek p
       JOIN tb_penugasan_proyek pa ON pa.id_proyek = p.id_proyek
       LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
       LEFT JOIN tb_tugas t ON t.id_proyek = p.id_proyek
       WHERE pa.id_user = $1 AND p.status = 'active'
       GROUP BY p.id_proyek, p.nama_proyek, p.description, p.start_date, p.end_date, p.status,
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT u.id_user AS id, u.nama AS name, u.email, u.created_at,
        COUNT(DISTINCT pa.id_proyek)::int AS project_count,
        COUNT(DISTINCT t.id_tugas)::int AS total_tasks,
        COUNT(DISTINCT t.id_tugas) FILTER (WHERE t.status = 'done')::int AS completed_tasks,
        COUNT(DISTINCT t.id_tugas) FILTER (WHERE t.status = 'working_on_it')::int AS active_tasks,
        COUNT(DISTINCT t.id_tugas) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'done')::int AS overdue_tasks,
        COALESCE(SUM(t.time_spent_seconds), 0)::int AS total_time_seconds,
        COUNT(DISTINCT te.id_bukti)::int AS evidence_count,
        BOOL_OR(
          t.timeline_start IS NOT NULL AND t.timeline_end IS NOT NULL
          AND t.timeline_start <= CURRENT_DATE AND t.timeline_end >= CURRENT_DATE
          AND t.status IN ('to_do', 'working_on_it')
        ) AS busy_today,
        COUNT(DISTINCT t.id_tugas) FILTER (WHERE t.due_date = CURRENT_DATE AND t.status != 'done')::int AS tasks_due_today
       FROM tb_user u
       LEFT JOIN tb_penugasan_proyek pa ON pa.id_user = u.id_user
       LEFT JOIN tb_tugas t ON t.assigned_to = u.id_user
       LEFT JOIN tb_bukti te ON te.uploaded_by = u.id_user
       WHERE u.role = 'teknisi'
       GROUP BY u.id_user, u.nama, u.email, u.created_at
       ORDER BY u.nama ASC`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get technicians error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getTechnicianDetail(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const techId = parseInt(id);
  if (isNaN(techId)) {
    return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  }

  try {
    // Basic info
    const userResult = await query(
      "SELECT id_user AS id, nama AS name, email, role, created_at FROM tb_user WHERE id_user = $1 AND role = 'teknisi'",
      [techId]
    );
    if (userResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Technician not found' }, { status: 404 });
    }
    const technician = userResult.rows[0];

    // Assigned projects with health
    const projectsResult = await query(
      `SELECT p.id_proyek AS id, p.project_code, p.nama_proyek AS name, p.status, p.phase, p.start_date, p.end_date,
              c.nama_klien AS client_name,
              ph.spi_value, ph.status AS health_status,
              COUNT(t.id_tugas)::int AS my_tasks,
              COUNT(t.id_tugas) FILTER (WHERE t.status = 'done')::int AS my_completed
       FROM tb_penugasan_proyek pa
       JOIN tb_proyek p ON p.id_proyek = pa.id_proyek
       LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
       LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
       LEFT JOIN tb_tugas t ON t.id_proyek = p.id_proyek AND t.assigned_to = $1
       WHERE pa.id_user = $1
       GROUP BY p.id_proyek, p.project_code, p.nama_proyek, p.status, p.phase, p.start_date, p.end_date,
                c.nama_klien, ph.spi_value, ph.status
       ORDER BY p.status ASC, p.end_date ASC`,
      [techId]
    );

    // Task breakdown (in_progress/review tetap 0 di model 3-status)
    const taskStats = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'to_do')::int AS to_do,
         COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
         COUNT(*) FILTER (WHERE status = 'working_on_it')::int AS working_on_it,
         COUNT(*) FILTER (WHERE status = 'review')::int AS review,
         COUNT(*) FILTER (WHERE status = 'done')::int AS done,
         COUNT(*) FILTER (WHERE status != 'done' AND due_date < CURRENT_DATE)::int AS overdue,
         COALESCE(SUM(time_spent_seconds), 0)::int AS total_time_seconds
       FROM tb_tugas WHERE assigned_to = $1`,
      [techId]
    );

    // Recent tasks (last 10)
    const recentTasks = await query(
      `SELECT t.id_tugas AS id, t.nama_tugas AS name, t.status, t.due_date, t.time_spent_seconds,
              p.nama_proyek AS project_name, t.updated_at
       FROM tb_tugas t
       JOIN tb_proyek p ON p.id_proyek = t.id_proyek
       WHERE t.assigned_to = $1
       ORDER BY t.updated_at DESC
       LIMIT 10`,
      [techId]
    );

    // Evidence count
    const evidenceResult = await query(
      `SELECT COUNT(*)::int AS total FROM tb_bukti WHERE uploaded_by = $1`,
      [techId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...technician,
        projects: projectsResult.rows,
        task_stats: taskStats.rows[0],
        recent_tasks: recentTasks.rows,
        evidence_count: evidenceResult.rows[0]?.total ?? 0,
      },
    });
  } catch (err) {
    console.error('Get technician detail error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function createUser(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ success: false, error: 'name, email, password, and role are required' }, { status: 400 });
  }
  const allowedRoles = ['teknisi', 'manajer'];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ success: false, error: 'role must be one of: technician, manager' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ success: false, error: 'password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const emailCheck = await query('SELECT id_user FROM tb_user WHERE email = $1', [email]);
    if (emailCheck.rowCount && emailCheck.rowCount > 0) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO tb_user (nama, email, role, password) VALUES ($1, $2, $3, $4) RETURNING id_user AS id, nama AS name, email, role, created_at',
      [name, email, role, passwordHash]
    );
    const newUser = result.rows[0] as { id: number; name: string };
    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, email, role } = body;

  const allowedRoles = ['teknisi', 'manajer'];
  if (role !== undefined && !allowedRoles.includes(role)) {
    return NextResponse.json({ success: false, error: 'role must be one of: technician, manager' }, { status: 400 });
  }

  try {
    const current = await query('SELECT id_user AS id, nama AS name, email, role FROM tb_user WHERE id_user = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;

    if (email !== undefined && email !== row.email) {
      const emailCheck = await query('SELECT id_user FROM tb_user WHERE email = $1 AND id_user != $2', [email, userId]);
      if (emailCheck.rowCount && emailCheck.rowCount > 0) {
        return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
      }
    }

    const result = await query(
      'UPDATE tb_user SET nama=$1, email=$2, role=$3 WHERE id_user=$4 RETURNING id_user AS id, nama AS name, email, role, created_at',
      [
        name !== undefined ? name : row.name,
        email !== undefined ? email : row.email,
        role !== undefined ? role : row.role,
        userId,
      ]
    );
    const updated = result.rows[0] as Record<string, unknown>;
    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
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
    const current = await query('SELECT id_user AS id, nama AS name FROM tb_user WHERE id_user = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as { id: number; name: string };

    const passwordHash = bcrypt.hashSync(password, 10);
    await query('UPDATE tb_user SET password = $1 WHERE id_user = $2', [passwordHash, userId]);

    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
  }
  if (userId === auth.user.userId) {
    return NextResponse.json({ success: false, error: 'Cannot delete yourself' }, { status: 400 });
  }

  try {
    const current = await query('SELECT id_user AS id, nama AS name FROM tb_user WHERE id_user = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as { id: number; name: string };

    await query('DELETE FROM tb_user WHERE id_user = $1', [userId]);

    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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

export async function deactivateUser(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
  }
  if (userId === auth.user.userId) {
    return NextResponse.json({ success: false, error: 'Tidak bisa menonaktifkan akun sendiri' }, { status: 400 });
  }

  try {
    const current = await query('SELECT id_user AS id, nama AS name, role FROM tb_user WHERE id_user = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as { id: number; name: string; role: string };

    if (row.role === 'manajer') {
      const activeManagers = await query(
        "SELECT COUNT(*)::int AS cnt FROM tb_user WHERE role = 'manajer' AND is_active = TRUE AND id_user != $1",
        [userId]
      );
      const cnt = (activeManagers.rows[0] as { cnt: number }).cnt;
      if (cnt === 0) {
        return NextResponse.json({ success: false, error: 'Tidak bisa menonaktifkan manajer terakhir yang aktif' }, { status: 400 });
      }
    }

    await query('UPDATE tb_user SET is_active = FALSE WHERE id_user = $1', [userId]);

    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'user',
      entityId: userId,
      entityName: row.name,
      action: 'update',
      changes: [{ field: 'is_active', oldValue: 'true', newValue: 'false' }],
      userId: auth.user.userId,
      userName: actorName,
    });
    return NextResponse.json({ success: true, message: 'Pengguna dinonaktifkan' });
  } catch (err) {
    console.error('Deactivate user error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function activateUser(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
  }

  try {
    const current = await query('SELECT id_user AS id, nama AS name FROM tb_user WHERE id_user = $1', [userId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const row = current.rows[0] as { id: number; name: string };

    await query('UPDATE tb_user SET is_active = TRUE WHERE id_user = $1', [userId]);

    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'user',
      entityId: userId,
      entityName: row.name,
      action: 'update',
      changes: [{ field: 'is_active', oldValue: 'false', newValue: 'true' }],
      userId: auth.user.userId,
      userName: actorName,
    });
    return NextResponse.json({ success: true, message: 'Pengguna diaktifkan' });
  } catch (err) {
    console.error('Activate user error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
