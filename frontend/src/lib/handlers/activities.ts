import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const VALID_ACTIVITY_TYPES = ['arrival', 'start_work', 'pause', 'resume', 'note', 'photo', 'complete'];

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

export async function createActivity(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const task_id = formData.get('task_id') as string;
  const message = formData.get('message') as string;
  const activity_type = formData.get('activity_type') as string | null;

  if (!task_id) return NextResponse.json({ success: false, error: 'task_id is required' }, { status: 400 });
  if (!message || message.trim().length === 0) return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
  if (file) {
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel' }, { status: 400 });
    }
  }

  const finalType = activity_type && VALID_ACTIVITY_TYPES.includes(activity_type) ? activity_type : 'note';
  let savedFilePath: string | null = null;

  try {
    const taskCheck = await query<{ id: number; project_id: number; assigned_to: number }>(
      'SELECT id_tugas AS id, id_proyek AS project_id, assigned_to FROM tb_tugas WHERE id_tugas = $1', [task_id]
    );
    if (taskCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    const task = taskCheck.rows[0];

    if (auth.user.role === 'teknisi' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'You can only add activities to tasks assigned to you' }, { status: 403 });
    }

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize = 0;

    if (file) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'projects', String(task.project_id), 'tasks', String(task_id), 'activities');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = sanitizeFilename(file.name);
      savedFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(savedFilePath, Buffer.from(await file.arrayBuffer()));
      filePath = path.join('uploads', 'projects', String(task.project_id), 'tasks', String(task_id), 'activities', filename).replace(/\\/g, '/');
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
    }

    const result = await query(
      `INSERT INTO task_activities (task_id, user_id, message, activity_type, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [task_id, auth.user.userId, message.trim(), finalType, filePath, fileName, fileType, fileSize]
    );
    const activity = result.rows[0] as Record<string, unknown>;
    const userResult = await query<{ name: string }>('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId]);
    return NextResponse.json({ success: true, data: { ...activity, user_name: userResult.rows[0]?.name || null } }, { status: 201 });
  } catch (err) {
    if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
    console.error('Create activity error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getMyTodayActivities(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const result = await query(
      `SELECT a.*, t.nama_tugas AS task_name, p.nama_proyek AS project_name
       FROM task_activities a JOIN tb_tugas t ON t.id_tugas = a.task_id JOIN tb_proyek p ON p.id_proyek = t.id_proyek
       WHERE a.user_id = $1 AND a.created_at >= CURRENT_DATE ORDER BY a.created_at ASC`,
      [auth.user.userId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get my today activities error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getActivitiesByTask(request: NextRequest, taskId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(taskId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });

  try {
    if (auth.user.role === 'teknisi') {
      const taskCheck = await query<{ assigned_to: number }>('SELECT assigned_to FROM tb_tugas WHERE id_tugas = $1', [id]);
      if (taskCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      if (taskCheck.rows[0].assigned_to !== auth.user.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }
    }
    const result = await query(
      `SELECT a.*, u.nama AS user_name FROM task_activities a LEFT JOIN tb_user u ON u.id_user = a.user_id
       WHERE a.task_id = $1 ORDER BY a.created_at ASC`,
      [id]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get activities error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
