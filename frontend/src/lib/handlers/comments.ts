import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// SELECT kolom tb_komentar_proyek di-alias balik ke nama JS UI (lihat konvensi
// alias di escalations.ts). Join tb_user utk author_name.
const KOMENTAR_COLS = `k.id_komentar AS id, k.id_proyek AS project_id, k.author_id,
  k.parent_id, k.message, k.is_edited, k.created_at, k.updated_at, u.nama AS author_name`;
const KOMENTAR_RETURNING = `RETURNING id_komentar AS id, id_proyek AS project_id, author_id,
  parent_id, message, is_edited, created_at, updated_at`;

// Boleh baca & posting bila manajer/admin ATAU teknisi yang ditugaskan ke proyek.
async function canAccessProject(projectId: number, userId: number, role: string): Promise<boolean> {
  if (role === 'manajer' || role === 'admin') return true;
  const res = await query(
    'SELECT 1 FROM tb_penugasan_proyek WHERE id_proyek = $1 AND id_user = $2',
    [projectId, userId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function listProjectComments(request: NextRequest, projectId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(projectId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });

  try {
    const allowed = await canAccessProject(id, auth.user.userId, auth.user.role);
    if (!allowed) return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });

    const result = await query(
      `SELECT ${KOMENTAR_COLS}
       FROM tb_komentar_proyek k
       LEFT JOIN tb_user u ON u.id_user = k.author_id
       WHERE k.id_proyek = $1
       ORDER BY k.created_at ASC`,
      [id]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List project comments error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function createProjectComment(request: NextRequest, projectId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(projectId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });

  const body = await request.json();
  const { message, parent_id } = body as { message?: string; parent_id?: number };
  if (!message || message.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
  }

  try {
    const allowed = await canAccessProject(id, auth.user.userId, auth.user.role);
    if (!allowed) return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });

    const result = await query(
      `INSERT INTO tb_komentar_proyek (id_proyek, author_id, parent_id, message)
       VALUES ($1, $2, $3, $4)
       ${KOMENTAR_RETURNING}`,
      [id, auth.user.userId, parent_id ?? null, message.trim()]
    );
    const comment = result.rows[0] as Record<string, unknown>;
    const userRes = await query<{ name: string }>('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId]);
    return NextResponse.json({ success: true, data: { ...comment, author_name: userRes.rows[0]?.name || null } }, { status: 201 });
  } catch (err) {
    console.error('Create project comment error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateComment(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const commentId = parseInt(id);
  if (isNaN(commentId)) return NextResponse.json({ success: false, error: 'Invalid comment ID' }, { status: 400 });

  const body = await request.json();
  const { message } = body as { message?: string };
  if (!message || message.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
  }

  try {
    const check = await query<{ author_id: number }>(
      'SELECT author_id FROM tb_komentar_proyek WHERE id_komentar = $1', [commentId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    if (check.rows[0].author_id !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Kamu hanya bisa mengubah komentarmu sendiri' }, { status: 403 });
    }
    const result = await query(
      `UPDATE tb_komentar_proyek SET message=$1, is_edited=TRUE, updated_at=NOW()
       WHERE id_komentar=$2 ${KOMENTAR_RETURNING}`,
      [message.trim(), commentId]
    );
    const comment = result.rows[0] as Record<string, unknown>;
    const userRes = await query<{ name: string }>('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId]);
    return NextResponse.json({ success: true, data: { ...comment, author_name: userRes.rows[0]?.name || null } });
  } catch (err) {
    console.error('Update comment error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteComment(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const commentId = parseInt(id);
  if (isNaN(commentId)) return NextResponse.json({ success: false, error: 'Invalid comment ID' }, { status: 400 });

  try {
    const check = await query<{ author_id: number }>(
      'SELECT author_id FROM tb_komentar_proyek WHERE id_komentar = $1', [commentId]
    );
    if (check.rowCount === 0) return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    const role = auth.user.role;
    const isManager = role === 'manajer' || role === 'admin';
    if (check.rows[0].author_id !== auth.user.userId && !isManager) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    await query('DELETE FROM tb_komentar_proyek WHERE id_komentar = $1', [commentId]);
    return NextResponse.json({ success: true, data: { id: commentId } });
  } catch (err) {
    console.error('Delete comment error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
