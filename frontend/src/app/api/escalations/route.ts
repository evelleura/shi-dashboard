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

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// GET /api/escalations - List escalations
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const userId = auth.user.userId;
    const role = auth.user.role;
    const searchParams = request.nextUrl.searchParams;
    const filterStatus = searchParams.get('status');
    const projectIdStr = searchParams.get('project_id');

    let baseQuery = `
      SELECT e.*,
        ur.name AS reporter_name,
        uv.name AS resolver_name,
        t.name AS task_name,
        p.name AS project_name
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

    if (filterStatus && ['open', 'in_review', 'resolved'].includes(filterStatus)) {
      conditions.push(`e.status = $${paramIdx++}`);
      params.push(filterStatus);
    }

    if (projectIdStr && !isNaN(parseInt(projectIdStr))) {
      conditions.push(`e.project_id = $${paramIdx++}`);
      params.push(parseInt(projectIdStr));
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    baseQuery += `
      ORDER BY
        CASE e.status WHEN 'open' THEN 1 WHEN 'in_review' THEN 2 WHEN 'resolved' THEN 3 END,
        CASE e.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
        e.created_at DESC
    `;

    const result = await query(baseQuery, params);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List escalations error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/escalations - Create escalation (with optional file)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const userId = auth.user.userId;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const task_id = formData.get('task_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string | null;

  if (!task_id) {
    return NextResponse.json({ success: false, error: 'task_id is required' }, { status: 400 });
  }

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
  }

  if (!description || description.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'description is required' }, { status: 400 });
  }

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

  const finalPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'medium';

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

    if (auth.user.role === 'technician' && task.assigned_to !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only escalate tasks assigned to you' },
        { status: 403 }
      );
    }

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize = 0;

    if (file) {
      const uploadDir = path.join(
        process.cwd(), 'uploads', 'projects', String(task.project_id), 'escalations'
      );
      fs.mkdirSync(uploadDir, { recursive: true });

      const filename = sanitizeFilename(file.name);
      savedFilePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(savedFilePath, buffer);

      filePath = path.join(
        'uploads', 'projects', String(task.project_id), 'escalations', filename
      ).replace(/\\/g, '/');
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
    }

    const result = await query(
      `INSERT INTO escalations (task_id, project_id, reported_by, title, description, priority, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [task_id, task.project_id, userId, title.trim(), description.trim(), finalPriority, filePath, fileName, fileType, fileSize]
    );

    const escalation = result.rows[0] as Record<string, unknown>;

    const userResult = await query<{ name: string }>('SELECT name FROM users WHERE id = $1', [userId]);
    const taskName = await query<{ name: string }>('SELECT name FROM tasks WHERE id = $1', [task_id]);
    const projectName = await query<{ name: string }>('SELECT name FROM projects WHERE id = $1', [task.project_id]);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...escalation,
          reporter_name: userResult.rows[0]?.name || null,
          task_name: taskName.rows[0]?.name || null,
          project_name: projectName.rows[0]?.name || null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
    console.error('Create escalation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
