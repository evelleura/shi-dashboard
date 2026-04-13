import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
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

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

function getEvidenceType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'photo';
  if (mimetype === 'application/pdf' || mimetype.includes('word') || mimetype.includes('document') || mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'document';
  return 'other';
}

export async function uploadEvidence(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const taskId = formData.get('task_id') as string;
  const fileType = formData.get('file_type') as string | null;
  const description = formData.get('description') as string | null;

  if (!taskId) return NextResponse.json({ success: false, error: 'task_id is required' }, { status: 400 });
  if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel' }, { status: 400 });
  }

  let savedFilePath: string | null = null;
  try {
    const taskCheck = await query('SELECT id, project_id FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    const projectId = (taskCheck.rows[0] as Record<string, unknown>).project_id;

    const uploadDir = path.join(process.cwd(), 'uploads', 'projects', String(projectId), 'tasks', String(taskId));
    fs.mkdirSync(uploadDir, { recursive: true });
    const filename = sanitizeFilename(file.name);
    savedFilePath = path.join(uploadDir, filename);
    fs.writeFileSync(savedFilePath, Buffer.from(await file.arrayBuffer()));
    const relativePath = path.join('uploads', 'projects', String(projectId), 'tasks', String(taskId), filename).replace(/\\/g, '/');

    const validTypes = ['photo', 'document', 'form', 'screenshot', 'other'];
    const evidenceType = fileType || getEvidenceType(file.type);
    const finalType = validTypes.includes(evidenceType) ? evidenceType : 'other';

    const result = await query(
      `INSERT INTO task_evidence (task_id, file_path, file_name, file_type, file_size, description, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [taskId, relativePath, file.name, finalType, file.size, description || null, auth.user.userId]
    );
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
    console.error('Upload evidence error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getEvidenceByTask(request: NextRequest, taskId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(taskId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });

  try {
    const result = await query(
      `SELECT te.*, u.name AS uploaded_by_name FROM task_evidence te
       LEFT JOIN users u ON u.id = te.uploaded_by
       WHERE te.task_id = $1 ORDER BY te.uploaded_at DESC`,
      [id]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get evidence error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteEvidence(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const evidenceId = parseInt(id);
  if (isNaN(evidenceId)) return NextResponse.json({ success: false, error: 'Invalid evidence ID' }, { status: 400 });

  try {
    const result = await query('SELECT file_path FROM task_evidence WHERE id = $1', [evidenceId]);
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
    const evidence = result.rows[0] as { file_path: string };
    await query('DELETE FROM task_evidence WHERE id = $1', [evidenceId]);
    const filePath = path.join(process.cwd(), evidence.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return NextResponse.json({ success: true, message: 'Evidence deleted successfully' });
  } catch (err) {
    console.error('Delete evidence error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function downloadEvidence(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const evidenceId = parseInt(id);
  if (isNaN(evidenceId)) return NextResponse.json({ success: false, error: 'Invalid evidence ID' }, { status: 400 });

  try {
    const result = await query('SELECT file_path, file_name FROM task_evidence WHERE id = $1', [evidenceId]);
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
    const evidence = result.rows[0] as { file_path: string; file_name: string };
    const filePath = path.join(process.cwd(), evidence.file_path);
    if (!existsSync(filePath)) return NextResponse.json({ success: false, error: 'File not found on disk' }, { status: 404 });
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${evidence.file_name}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (err) {
    console.error('Download evidence error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
