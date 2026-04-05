import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/evidence/:id/download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const evidenceId = parseInt(id);
  if (isNaN(evidenceId)) {
    return NextResponse.json({ success: false, error: 'Invalid evidence ID' }, { status: 400 });
  }

  try {
    const result = await query(
      'SELECT file_path, file_name FROM task_evidence WHERE id = $1',
      [evidenceId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
    }

    const evidence = result.rows[0] as { file_path: string; file_name: string };
    const filePath = path.join(process.cwd(), evidence.file_path);

    if (!existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File not found on disk' }, { status: 404 });
    }

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
