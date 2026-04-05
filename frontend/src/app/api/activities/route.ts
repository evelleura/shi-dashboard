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

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

const VALID_ACTIVITY_TYPES = ['arrival', 'start_work', 'pause', 'resume', 'note', 'photo', 'complete'];

// POST /api/activities - Create activity (with optional file upload)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const task_id = formData.get('task_id') as string;
  const message = formData.get('message') as string;
  const activity_type = formData.get('activity_type') as string | null;

  if (!task_id) {
    return NextResponse.json({ success: false, error: 'task_id is required' }, { status: 400 });
  }

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
  }

  // Validate file if provided
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel' },
        { status: 400 }
      );
    }
  }

  const finalType = activity_type && VALID_ACTIVITY_TYPES.includes(activity_type)
    ? activity_type
    : 'note';

  let savedFilePath: string | null = null;

  try {
    const taskCheck = await query<{ id: number; project_id: number; assigned_to: number }>(
      'SELECT id, project_id, assigned_to FROM tasks WHERE id = $1',
      [task_id]
    );

    if (taskCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const task = taskCheck.rows[0];

    // Technician: verify assigned
    if (auth.user.role === 'technician' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only add activities to tasks assigned to you' },
        { status: 403 }
      );
    }

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize = 0;

    if (file) {
      const uploadDir = path.join(
        process.cwd(), 'uploads', 'projects', String(task.project_id),
        'tasks', String(task_id), 'activities'
      );
      fs.mkdirSync(uploadDir, { recursive: true });

      const filename = sanitizeFilename(file.name);
      savedFilePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(savedFilePath, buffer);

      filePath = path.join(
        'uploads', 'projects', String(task.project_id),
        'tasks', String(task_id), 'activities', filename
      ).replace(/\\/g, '/');
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
    }

    const result = await query(
      `INSERT INTO task_activities (task_id, user_id, message, activity_type, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [task_id, auth.user.userId, message.trim(), finalType, filePath, fileName, fileType, fileSize]
    );

    const activity = result.rows[0] as Record<string, unknown>;
    const userResult = await query<{ name: string }>('SELECT name FROM users WHERE id = $1', [auth.user.userId]);
    const userName = userResult.rows[0]?.name || null;

    return NextResponse.json(
      { success: true, data: { ...activity, user_name: userName } },
      { status: 201 }
    );
  } catch (err) {
    if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
    console.error('Create activity error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
