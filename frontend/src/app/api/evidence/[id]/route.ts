import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// DELETE /api/evidence/:id - Delete evidence file (manager/admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const evidenceId = parseInt(id);
  if (isNaN(evidenceId)) {
    return NextResponse.json({ success: false, error: 'Invalid evidence ID' }, { status: 400 });
  }

  try {
    const result = await query(
      'SELECT file_path FROM task_evidence WHERE id = $1',
      [evidenceId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
    }

    const evidence = result.rows[0] as { file_path: string };

    await query('DELETE FROM task_evidence WHERE id = $1', [evidenceId]);

    const filePath = path.join(process.cwd(), evidence.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ success: true, message: 'Evidence deleted successfully' });
  } catch (err) {
    console.error('Delete evidence error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
