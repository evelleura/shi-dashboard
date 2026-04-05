import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

function getEvidenceType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'photo';
  if (mimetype === 'application/pdf') return 'document';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'document';
  return 'other';
}

// POST /api/evidence/upload
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const taskId = formData.get('task_id') as string;
  const fileType = formData.get('file_type') as string | null;
  const description = formData.get('description') as string | null;

  if (!taskId) {
    return NextResponse.json({ success: false, error: 'task_id is required' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
  }

  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel' },
      { status: 400 }
    );
  }

  let savedFilePath: string | null = null;

  try {
    const taskCheck = await query('SELECT id, project_id FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const projectId = (taskCheck.rows[0] as Record<string, unknown>).project_id;

    const uploadDir = path.join(process.cwd(), 'uploads', 'projects', String(projectId), 'tasks', String(taskId));
    fs.mkdirSync(uploadDir, { recursive: true });

    const filename = sanitizeFilename(file.name);
    savedFilePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(savedFilePath, buffer);

    const relativePath = path.join('uploads', 'projects', String(projectId), 'tasks', String(taskId), filename)
      .replace(/\\/g, '/');

    const evidenceType = fileType || getEvidenceType(file.type);
    const validTypes = ['photo', 'document', 'form', 'screenshot', 'other'];
    const finalType = validTypes.includes(evidenceType) ? evidenceType : 'other';

    const result = await query(
      `INSERT INTO task_evidence (task_id, file_path, file_name, file_type, file_size, description, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [taskId, relativePath, file.name, finalType, file.size, description || null, auth.user.userId]
    );

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    if (savedFilePath && fs.existsSync(savedFilePath)) {
      fs.unlinkSync(savedFilePath);
    }
    console.error('Upload evidence error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
