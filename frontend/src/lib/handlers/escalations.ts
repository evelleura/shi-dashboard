import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

export async function listEscalations(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const userId = auth.user.userId;
    const role = auth.user.role;
    const searchParams = request.nextUrl.searchParams;
    const filterStatus = searchParams.get('status');
    const projectIdStr = searchParams.get('project_id');

    let baseQuery = `
      SELECT e.*, ur.name AS reporter_name, uv.name AS resolver_name,
        t.name AS task_name, p.name AS project_name
      FROM escalations e
      LEFT JOIN users ur ON ur.id = e.reported_by
      LEFT JOIN users uv ON uv.id = e.resolved_by
      LEFT JOIN tasks t ON t.id = e.task_id
      LEFT JOIN projects p ON p.id = e.project_id
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (role === 'technician') {
      conditions.push(`e.reported_by = $${paramIdx++}`);
      params.push(userId);
    }
    if (filterStatus && ['open', 'in_review', 'resolved', 'cancelled'].includes(filterStatus)) {
      conditions.push(`e.status = $${paramIdx++}`);
      params.push(filterStatus);
    }
    if (projectIdStr && !isNaN(parseInt(projectIdStr))) {
      conditions.push(`e.project_id = $${paramIdx++}`);
      params.push(parseInt(projectIdStr));
    }
    if (conditions.length > 0) baseQuery += ' WHERE ' + conditions.join(' AND ');
    baseQuery += `
      ORDER BY
        CASE e.status WHEN 'open' THEN 1 WHEN 'in_review' THEN 2 WHEN 'resolved' THEN 3 WHEN 'cancelled' THEN 4 END,
        CASE e.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
        e.created_at DESC`;

    const result = await query(baseQuery, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List escalations error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function createEscalation(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const userId = auth.user.userId;
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const task_id = formData.get('task_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string | null;

  if (!task_id) return NextResponse.json({ success: false, error: 'task_id is required' }, { status: 400 });
  if (!title || title.trim().length === 0) return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
  if (!description || description.trim().length === 0) return NextResponse.json({ success: false, error: 'description is required' }, { status: 400 });

  if (file) {
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel' }, { status: 400 });
    }
  }

  const finalPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'medium';
  let savedFilePath: string | null = null;

  try {
    const taskCheck = await query<{ id: number; project_id: number; assigned_to: number }>(
      'SELECT id, project_id, assigned_to FROM tasks WHERE id = $1', [task_id]
    );
    if (taskCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    const task = taskCheck.rows[0];

    if (auth.user.role === 'technician' && task.assigned_to !== userId) {
      return NextResponse.json({ success: false, error: 'You can only escalate tasks assigned to you' }, { status: 403 });
    }

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize = 0;

    if (file) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'projects', String(task.project_id), 'escalations');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = sanitizeFilename(file.name);
      savedFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(savedFilePath, Buffer.from(await file.arrayBuffer()));
      filePath = path.join('uploads', 'projects', String(task.project_id), 'escalations', filename).replace(/\\/g, '/');
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
    }

    const result = await query(
      `INSERT INTO escalations (task_id, project_id, reported_by, title, description, priority, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [task_id, task.project_id, userId, title.trim(), description.trim(), finalPriority, filePath, fileName, fileType, fileSize]
    );
    const escalation = result.rows[0] as Record<string, unknown>;
    const [userResult, taskName, projectName] = await Promise.all([
      query<{ name: string }>('SELECT name FROM users WHERE id = $1', [userId]),
      query<{ name: string }>('SELECT name FROM tasks WHERE id = $1', [task_id]),
      query<{ name: string }>('SELECT name FROM projects WHERE id = $1', [task.project_id]),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...escalation, reporter_name: userResult.rows[0]?.name || null, task_name: taskName.rows[0]?.name || null, project_name: projectName.rows[0]?.name || null },
    }, { status: 201 });
  } catch (err) {
    if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
    console.error('Create escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getEscalation(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  try {
    const result = await query(
      `SELECT e.*, ur.name AS reporter_name, uv.name AS resolver_name, t.name AS task_name, p.name AS project_name
       FROM escalations e
       LEFT JOIN users ur ON ur.id = e.reported_by LEFT JOIN users uv ON uv.id = e.resolved_by
       LEFT JOIN tasks t ON t.id = e.task_id LEFT JOIN projects p ON p.id = e.project_id
       WHERE e.id = $1`,
      [escalationId]
    );
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const escalation = result.rows[0] as Record<string, unknown>;
    if (auth.user.role === 'technician' && escalation.reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: escalation });
  } catch (err) {
    console.error('Get escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function reviewEscalation(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  try {
    const check = await query('SELECT id, status FROM escalations WHERE id = $1', [escalationId]);
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if ((check.rows[0] as Record<string, unknown>).status === 'resolved') {
      return NextResponse.json({ success: false, error: 'Escalation is already resolved' }, { status: 409 });
    }
    const result = await query(
      `UPDATE escalations SET status='in_review', updated_at=NOW() WHERE id=$1 RETURNING *`,
      [escalationId]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Review escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function resolveEscalation(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  const body = await request.json();
  const { resolution_notes } = body;
  if (!resolution_notes || typeof resolution_notes !== 'string' || resolution_notes.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'resolution_notes is required' }, { status: 400 });
  }

  try {
    const check = await query('SELECT id, status FROM escalations WHERE id = $1', [escalationId]);
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if ((check.rows[0] as Record<string, unknown>).status === 'resolved') {
      return NextResponse.json({ success: false, error: 'Escalation is already resolved' }, { status: 409 });
    }
    const result = await query(
      `UPDATE escalations SET status='resolved', resolved_by=$1, resolved_at=NOW(), resolution_notes=$2, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [auth.user.userId, resolution_notes.trim(), escalationId]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Resolve escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function addUpdate(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  const body = await request.json();
  const { message } = body as { message?: string };
  if (!message || message.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
  }

  try {
    const escCheck = await query<{ reported_by: number; status: string }>(
      'SELECT reported_by, status FROM escalations WHERE id = $1', [escalationId]
    );
    if (escCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const esc = escCheck.rows[0];
    const role = auth.user.role;
    if (role === 'technician' && esc.reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    if (esc.status === 'resolved') {
      return NextResponse.json({ success: false, error: 'Tidak bisa menambah catatan pada eskalasi yang sudah diselesaikan' }, { status: 409 });
    }
    const result = await query(
      `INSERT INTO escalation_updates (escalation_id, author_id, message) VALUES ($1, $2, $3) RETURNING *`,
      [escalationId, auth.user.userId, message.trim()]
    );
    const update = result.rows[0] as Record<string, unknown>;
    const userRes = await query<{ name: string }>('SELECT name FROM users WHERE id = $1', [auth.user.userId]);
    return NextResponse.json({ success: true, data: { ...update, author_name: userRes.rows[0]?.name || null } }, { status: 201 });
  } catch (err) {
    console.error('Add escalation update error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getUpdates(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  try {
    const escCheck = await query<{ reported_by: number }>(
      'SELECT reported_by FROM escalations WHERE id = $1', [escalationId]
    );
    if (escCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if (auth.user.role === 'technician' && escCheck.rows[0].reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    const result = await query(
      `SELECT eu.*, u.name AS author_name
       FROM escalation_updates eu
       LEFT JOIN users u ON u.id = eu.author_id
       WHERE eu.escalation_id = $1
       ORDER BY eu.created_at ASC`,
      [escalationId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get escalation updates error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteEscalation(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  try {
    const check = await query<{ status: string }>(
      'SELECT status FROM escalations WHERE id = $1', [escalationId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if (check.rows[0].status === 'resolved') {
      return NextResponse.json({ success: false, error: 'Eskalasi yang sudah diselesaikan tidak bisa dihapus' }, { status: 409 });
    }

    await query('DELETE FROM escalations WHERE id = $1', [escalationId]);
    return NextResponse.json({ success: true, data: { id: escalationId } });
  } catch (err) {
    console.error('Delete escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

const VALID_ACTION_REQUESTS = ['ganti_teknisi', 'ganti_material', 'perpanjang_deadline', 'mediasi_client', 'batalkan_eskalasi'];

export async function requestAction(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  const body = await request.json();
  const { action_request, action_request_note } = body as { action_request?: string; action_request_note?: string };

  if (!action_request || !VALID_ACTION_REQUESTS.includes(action_request)) {
    return NextResponse.json({ success: false, error: `action_request harus salah satu dari: ${VALID_ACTION_REQUESTS.join(', ')}` }, { status: 400 });
  }
  if (!action_request_note || action_request_note.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Catatan untuk permintaan tindakan harus diisi' }, { status: 400 });
  }

  try {
    const check = await query<{ reported_by: number; status: string; action_request_status: string | null }>(
      'SELECT reported_by, status, action_request_status FROM escalations WHERE id = $1', [escalationId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const esc = check.rows[0];

    if (auth.user.role === 'technician' && esc.reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Kamu hanya bisa mengajukan tindakan pada eskalasi milikmu sendiri' }, { status: 403 });
    }
    if (!['open', 'in_review'].includes(esc.status)) {
      return NextResponse.json({ success: false, error: 'Permintaan tindakan hanya bisa diajukan pada eskalasi yang masih aktif' }, { status: 409 });
    }
    if (esc.action_request_status === 'pending') {
      return NextResponse.json({ success: false, error: 'Sudah ada permintaan tindakan yang sedang menunggu persetujuan manager' }, { status: 409 });
    }

    const result = await query(
      `UPDATE escalations SET action_request=$1, action_request_note=$2, action_request_status='pending', updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [action_request, action_request_note.trim(), escalationId]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Request action error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function respondActionRequest(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  const body = await request.json();
  const { status: responseStatus, response_note } = body as { status?: string; response_note?: string };

  if (!responseStatus || !['approved', 'rejected'].includes(responseStatus)) {
    return NextResponse.json({ success: false, error: 'status harus "approved" atau "rejected"' }, { status: 400 });
  }
  if (!response_note || response_note.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Catatan respons harus diisi' }, { status: 400 });
  }

  try {
    const check = await query<{ action_request_status: string | null; action_request: string | null }>(
      'SELECT action_request_status, action_request FROM escalations WHERE id = $1', [escalationId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const escRow = check.rows[0];
    if (escRow.action_request_status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Tidak ada permintaan tindakan yang sedang menunggu persetujuan' }, { status: 409 });
    }

    const shouldCancel = responseStatus === 'approved' && escRow.action_request === 'batalkan_eskalasi';
    const updateSql = shouldCancel
      ? `UPDATE escalations SET action_request_status=$1, action_request_note=$2, status='cancelled', updated_at=NOW() WHERE id=$3 RETURNING *`
      : `UPDATE escalations SET action_request_status=$1, action_request_note=$2, updated_at=NOW() WHERE id=$3 RETURNING *`;

    const result = await query(updateSql, [responseStatus, response_note.trim(), escalationId]);
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Respond action request error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getEscalationSummary(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const userId = auth.user.userId;
    const role = auth.user.role;
    const result = role === 'technician'
      ? await query(
          `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
            COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
            COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
            COUNT(*)::int AS total
           FROM escalations WHERE reported_by = $1`,
          [userId]
        )
      : await query(
          `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
            COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
            COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
            COUNT(*)::int AS total FROM escalations`
        );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Escalation summary error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
