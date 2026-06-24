import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';
import { createNotification } from './notifications';
import { logChange } from './audit';
import { executeEscalationAction, ActionError, type ActionParams, type ActionResult, type EscalationRow } from './escalationActions';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
// Naskah (Tabel 4.15) priority: low/medium/high. 'critical' dari UI -> clamp ke 'high'.
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// tb_eskalasi.status di DB pakai nilai naskah (open/handled/closed). Lapisan UI
// memakai nilai lama (open/in_review/resolved/cancelled). Helper berikut
// menerjemahkan dua arah supaya skema = naskah TANPA mengubah UI.
//   DB 'handled' -> UI 'in_review'  | DB 'closed' -> UI 'resolved'
const STATUS_DB_TO_UI = `CASE status WHEN 'handled' THEN 'in_review' WHEN 'closed' THEN 'resolved' ELSE status END AS status`;
const STATUS_DB_TO_UI_E = `CASE e.status WHEN 'handled' THEN 'in_review' WHEN 'closed' THEN 'resolved' ELSE e.status END AS status`;
function uiStatusToDb(ui: string): string {
  if (ui === 'in_review') return 'handled';
  if (ui === 'resolved' || ui === 'cancelled') return 'closed';
  return ui; // 'open'
}

// SELECT kolom tb_eskalasi (prefix e.) di-alias balik ke nama JS UI.
const ESKALASI_COLS_E = `e.id_eskalasi AS id, e.id_tugas AS task_id, e.id_proyek AS project_id,
  e.reported_by, e.title, e.description, ${STATUS_DB_TO_UI_E}, e.priority,
  e.file_path, e.file_name, e.file_type, e.file_size, e.resolved_by, e.resolved_at,
  e.resolution_notes, e.action_request, e.action_request_note, e.action_request_status,
  e.created_at, e.updated_at`;
const ESKALASI_RETURNING = `RETURNING id_eskalasi AS id, id_tugas AS task_id, id_proyek AS project_id,
  reported_by, title, description, ${STATUS_DB_TO_UI}, priority, file_path, file_name, file_type,
  file_size, resolved_by, resolved_at, resolution_notes, action_request, action_request_note,
  action_request_status, created_at, updated_at`;

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
      SELECT ${ESKALASI_COLS_E}, ur.nama AS reporter_name, uv.nama AS resolver_name,
        t.nama_tugas AS task_name, p.nama_proyek AS project_name
      FROM tb_eskalasi e
      LEFT JOIN tb_user ur ON ur.id_user = e.reported_by
      LEFT JOIN tb_user uv ON uv.id_user = e.resolved_by
      LEFT JOIN tb_tugas t ON t.id_tugas = e.id_tugas
      LEFT JOIN tb_proyek p ON p.id_proyek = e.id_proyek
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (role === 'teknisi') {
      conditions.push(`e.reported_by = $${paramIdx++}`);
      params.push(userId);
    }
    if (filterStatus && ['open', 'in_review', 'resolved', 'cancelled'].includes(filterStatus)) {
      conditions.push(`e.status = $${paramIdx++}`);
      params.push(uiStatusToDb(filterStatus));
    }
    if (projectIdStr && !isNaN(parseInt(projectIdStr))) {
      conditions.push(`e.id_proyek = $${paramIdx++}`);
      params.push(parseInt(projectIdStr));
    }
    if (conditions.length > 0) baseQuery += ' WHERE ' + conditions.join(' AND ');
    baseQuery += `
      ORDER BY
        CASE e.status WHEN 'open' THEN 1 WHEN 'handled' THEN 2 WHEN 'closed' THEN 3 END,
        CASE e.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
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

  const finalPriority = priority === 'critical' ? 'high'
    : (priority && VALID_PRIORITIES.includes(priority) ? priority : 'medium');
  let savedFilePath: string | null = null;

  try {
    const taskCheck = await query<{ id: number; project_id: number; assigned_to: number }>(
      'SELECT id_tugas AS id, id_proyek AS project_id, assigned_to FROM tb_tugas WHERE id_tugas = $1', [task_id]
    );
    if (taskCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    const task = taskCheck.rows[0];

    if (auth.user.role === 'teknisi' && task.assigned_to !== userId) {
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
      `INSERT INTO tb_eskalasi (id_tugas, id_proyek, reported_by, title, description, priority, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ${ESKALASI_RETURNING}`,
      [task_id, task.project_id, userId, title.trim(), description.trim(), finalPriority, filePath, fileName, fileType, fileSize]
    );
    const escalation = result.rows[0] as Record<string, unknown>;
    const [userResult, taskName, projectName] = await Promise.all([
      query<{ name: string }>('SELECT nama AS name FROM tb_user WHERE id_user = $1', [userId]),
      query<{ name: string }>('SELECT nama_tugas AS name FROM tb_tugas WHERE id_tugas = $1', [task_id]),
      query<{ name: string }>('SELECT nama_proyek AS name FROM tb_proyek WHERE id_proyek = $1', [task.project_id]),
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
      `SELECT ${ESKALASI_COLS_E}, ur.nama AS reporter_name, uv.nama AS resolver_name, t.nama_tugas AS task_name, p.nama_proyek AS project_name
       FROM tb_eskalasi e
       LEFT JOIN tb_user ur ON ur.id_user = e.reported_by LEFT JOIN tb_user uv ON uv.id_user = e.resolved_by
       LEFT JOIN tb_tugas t ON t.id_tugas = e.id_tugas LEFT JOIN tb_proyek p ON p.id_proyek = e.id_proyek
       WHERE e.id_eskalasi = $1`,
      [escalationId]
    );
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const escalation = result.rows[0] as Record<string, unknown>;
    if (auth.user.role === 'teknisi' && escalation.reported_by !== auth.user.userId) {
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  try {
    const check = await query('SELECT id_eskalasi AS id, status FROM tb_eskalasi WHERE id_eskalasi = $1', [escalationId]);
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if ((check.rows[0] as Record<string, unknown>).status === 'closed') {
      return NextResponse.json({ success: false, error: 'Escalation is already resolved' }, { status: 409 });
    }
    const result = await query(
      `UPDATE tb_eskalasi SET status='handled', updated_at=NOW() WHERE id_eskalasi=$1 ${ESKALASI_RETURNING}`,
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  const body = await request.json();
  const { resolution_notes } = body;
  if (!resolution_notes || typeof resolution_notes !== 'string' || resolution_notes.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'resolution_notes is required' }, { status: 400 });
  }

  try {
    const check = await query('SELECT id_eskalasi AS id, status FROM tb_eskalasi WHERE id_eskalasi = $1', [escalationId]);
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if ((check.rows[0] as Record<string, unknown>).status === 'closed') {
      return NextResponse.json({ success: false, error: 'Escalation is already resolved' }, { status: 409 });
    }
    const result = await query(
      `UPDATE tb_eskalasi SET status='closed', resolved_by=$1, resolved_at=NOW(), resolution_notes=$2, updated_at=NOW()
       WHERE id_eskalasi=$3 ${ESKALASI_RETURNING}`,
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
      'SELECT reported_by, status FROM tb_eskalasi WHERE id_eskalasi = $1', [escalationId]
    );
    if (escCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const esc = escCheck.rows[0];
    const role = auth.user.role;
    if (role === 'teknisi' && esc.reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    if (esc.status === 'closed') {
      return NextResponse.json({ success: false, error: 'Tidak bisa menambah catatan pada eskalasi yang sudah diselesaikan' }, { status: 409 });
    }
    const result = await query(
      `INSERT INTO escalation_updates (escalation_id, author_id, message) VALUES ($1, $2, $3) RETURNING *`,
      [escalationId, auth.user.userId, message.trim()]
    );
    const update = result.rows[0] as Record<string, unknown>;
    const userRes = await query<{ name: string }>('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId]);
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
      'SELECT reported_by FROM tb_eskalasi WHERE id_eskalasi = $1', [escalationId]
    );
    if (escCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if (auth.user.role === 'teknisi' && escCheck.rows[0].reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    const result = await query(
      `SELECT eu.*, u.nama AS author_name
       FROM escalation_updates eu
       LEFT JOIN tb_user u ON u.id_user = eu.author_id
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  try {
    const check = await query<{ status: string }>(
      'SELECT status FROM tb_eskalasi WHERE id_eskalasi = $1', [escalationId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    if (check.rows[0].status === 'closed') {
      return NextResponse.json({ success: false, error: 'Eskalasi yang sudah diselesaikan tidak bisa dihapus' }, { status: 409 });
    }

    await query('DELETE FROM tb_eskalasi WHERE id_eskalasi = $1', [escalationId]);
    return NextResponse.json({ success: true, data: { id: escalationId } });
  } catch (err) {
    console.error('Delete escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

const VALID_ACTION_REQUESTS = ['ganti_teknisi', 'ganti_alat', 'perpanjang_deadline', 'mediasi_client', 'batalkan_eskalasi'];

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
      'SELECT reported_by, status, action_request_status FROM tb_eskalasi WHERE id_eskalasi = $1', [escalationId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const esc = check.rows[0];

    if (auth.user.role === 'teknisi' && esc.reported_by !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Kamu hanya bisa mengajukan tindakan pada eskalasi milikmu sendiri' }, { status: 403 });
    }
    if (!['open', 'handled'].includes(esc.status)) {
      return NextResponse.json({ success: false, error: 'Permintaan tindakan hanya bisa diajukan pada eskalasi yang masih aktif' }, { status: 409 });
    }
    if (esc.action_request_status === 'pending') {
      return NextResponse.json({ success: false, error: 'Sudah ada permintaan tindakan yang sedang menunggu persetujuan manager' }, { status: 409 });
    }

    const result = await query(
      `UPDATE tb_eskalasi SET action_request=$1, action_request_note=$2, action_request_status='pending', updated_at=NOW()
       WHERE id_eskalasi=$3 ${ESKALASI_RETURNING}`,
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const escalationId = parseInt(id);
  if (isNaN(escalationId)) return NextResponse.json({ success: false, error: 'Invalid escalation ID' }, { status: 400 });

  const managerId = auth.user.userId;
  const body = await request.json();
  const { status: responseStatus, response_note, action_params } = body as
    { status?: string; response_note?: string; action_params?: ActionParams };

  if (!responseStatus || !['approved', 'rejected'].includes(responseStatus)) {
    return NextResponse.json({ success: false, error: 'status harus "approved" atau "rejected"' }, { status: 400 });
  }
  if (!response_note || response_note.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Catatan respons harus diisi' }, { status: 400 });
  }

  try {
    const check = await query<{ action_request_status: string | null; action_request: string | null;
      task_id: number; project_id: number; reported_by: number }>(
      `SELECT action_request_status, action_request, id_tugas AS task_id, id_proyek AS project_id, reported_by
       FROM tb_eskalasi WHERE id_eskalasi = $1`, [escalationId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    const escRow = check.rows[0];
    if (escRow.action_request_status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Tidak ada permintaan tindakan yang sedang menunggu persetujuan' }, { status: 409 });
    }

    // DITOLAK: cukup tandai rejected (perilaku lama, tanpa eksekusi).
    if (responseStatus === 'rejected') {
      const result = await query(
        `UPDATE tb_eskalasi SET action_request_status='rejected', action_request_note=$1, updated_at=NOW()
         WHERE id_eskalasi=$2 ${ESKALASI_RETURNING}`,
        [response_note.trim(), escalationId]
      );
      return NextResponse.json({ success: true, data: result.rows[0] });
    }

    // DISETUJUI: eksekusi tindakan NYATA dalam SATU transaksi (cascade atomik).
    const esc: EscalationRow = {
      id: escalationId, task_id: escRow.task_id, project_id: escRow.project_id,
      reported_by: escRow.reported_by, action_request: escRow.action_request ?? '',
    };
    let summary: ActionResult = { kind: 'none' };
    const updated = await withTransaction(async (client) => {
      summary = await executeEscalationAction(client, esc, action_params ?? {});
      // 'batalkan_eskalasi' yang disetujui -> tutup eskalasi (pakai 'closed', naskah tak punya 'cancelled').
      const shouldClose = esc.action_request === 'batalkan_eskalasi';
      const sql = shouldClose
        ? `UPDATE tb_eskalasi SET action_request_status='approved', action_request_note=$1, status='closed', updated_at=NOW() WHERE id_eskalasi=$2 ${ESKALASI_RETURNING}`
        : `UPDATE tb_eskalasi SET action_request_status='approved', action_request_note=$1, updated_at=NOW() WHERE id_eskalasi=$2 ${ESKALASI_RETURNING}`;
      const res = await client.query(sql, [response_note.trim(), escalationId]);
      await client.query(
        'INSERT INTO escalation_updates (escalation_id, author_id, message) VALUES ($1, $2, $3)',
        [escalationId, managerId, actionSummaryMessage(esc.action_request, summary)]
      );
      return res.rows[0];
    });

    // Efek-ikutan non-transaksional (rekalkulasi SPI, notifikasi, audit). Gagal di sini
    // TIDAK membatalkan cascade (sudah commit) -> cukup dicatat, bukan 500.
    try {
      await applyActionSideEffects(summary, esc, managerId);
    } catch (sideErr) {
      console.error('Action side-effects error (cascade already committed):', sideErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 });
    }
    console.error('Respond action request error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Ringkasan tindakan utk utas eskalasi (escalation_updates).
function actionSummaryMessage(action: string, summary: ActionResult): string {
  switch (summary.kind) {
    case 'ganti_teknisi':
      return `[Tindakan disetujui] Ganti teknisi: ${summary.taskIds.length} tugas dialihkan ke teknisi #${summary.newTechId}.`;
    case 'perpanjang_deadline':
      return `[Tindakan disetujui] Perpanjang deadline tugas hingga ${summary.newDue ?? '-'}${summary.projectEndChanged ? ' (end_date proyek ikut digeser)' : ''}.`;
    case 'recorded':
      return `[Tindakan disetujui] ${action === 'ganti_alat' ? 'Ganti alat' : 'Mediasi klien'} dicatat sebagai instruksi penanganan.`;
    default:
      return `[Tindakan disetujui] ${action}.`;
  }
}

async function actorName(userId: number): Promise<string> {
  const r = await query<{ name: string }>('SELECT nama AS name FROM tb_user WHERE id_user = $1', [userId]);
  return r.rows[0]?.name ?? 'Manajer';
}

// Efek-ikutan non-transaksional, dijalankan SETELAH cascade commit.
async function applyActionSideEffects(summary: ActionResult, esc: EscalationRow, managerId: number): Promise<void> {
  if (summary.kind === 'none') return;
  const uName = await actorName(managerId);

  if (summary.kind === 'ganti_teknisi') {
    await recalculateSPI(summary.projectId);   // SPI proyek; SPI teknisi X & Y ikut (live)
    const proj = await query<{ name: string }>('SELECT nama_proyek AS name FROM tb_proyek WHERE id_proyek = $1', [summary.projectId]);
    const pName = proj.rows[0]?.name ?? 'Proyek';
    await createNotification({
      userId: summary.newTechId, type: 'task_assigned',
      title: `Kamu mengambil alih ${summary.taskIds.length} tugas`,
      body: `Lewat persetujuan eskalasi, kamu ditugaskan ulang di proyek ${pName}.`,
      entityType: 'project', entityId: summary.projectId, projectId: summary.projectId,
    });
    if (summary.oldTechId) {
      await createNotification({
        userId: summary.oldTechId, type: 'task_unassigned',
        title: 'Tugas dialihkan ke teknisi lain',
        body: `${summary.taskIds.length} tugasmu di ${pName} dialihkan via eskalasi.`,
        entityType: 'project', entityId: summary.projectId, projectId: summary.projectId,
      });
    }
    await logChange({
      entityType: 'escalation', entityId: esc.id, entityName: `Eskalasi #${esc.id}`, action: 'ganti_teknisi',
      changes: [{ field: 'assigned_to', oldValue: summary.oldTechId != null ? String(summary.oldTechId) : null, newValue: String(summary.newTechId) }],
      userId: managerId, userName: uName,
    });
    return;
  }

  if (summary.kind === 'perpanjang_deadline') {
    await recalculateSPI(summary.projectId);   // PV berubah saat deadline/end_date digeser
    await logChange({
      entityType: 'escalation', entityId: esc.id, entityName: `Eskalasi #${esc.id}`, action: 'perpanjang_deadline',
      changes: [{ field: 'due_date', oldValue: null, newValue: summary.newDue }],
      userId: managerId, userName: uName,
    });
    return;
  }

  if (summary.kind === 'recorded') {
    await logChange({
      entityType: 'escalation', entityId: esc.id, entityName: `Eskalasi #${esc.id}`, action: summary.action,
      changes: [{ field: 'action', oldValue: null, newValue: summary.action }],
      userId: managerId, userName: uName,
    });
  }
}

export async function getEscalationSummary(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const userId = auth.user.userId;
    const role = auth.user.role;
    const result = role === 'teknisi'
      ? await query(
          `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
            COUNT(*) FILTER (WHERE status = 'handled')::int AS in_review,
            COUNT(*) FILTER (WHERE status = 'closed')::int AS resolved,
            COUNT(*)::int AS total
           FROM tb_eskalasi WHERE reported_by = $1`,
          [userId]
        )
      : await query(
          `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
            COUNT(*) FILTER (WHERE status = 'handled')::int AS in_review,
            COUNT(*) FILTER (WHERE status = 'closed')::int AS resolved,
            COUNT(*)::int AS total FROM tb_eskalasi`
        );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Escalation summary error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
