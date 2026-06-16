import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function createNotification({
  userId, type, title, body, entityType, entityId, projectId,
}: {
  userId: number;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  projectId?: number;
}) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, project_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, type, title, body ?? null, entityType ?? null, entityId ?? null, projectId ?? null]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export async function getNotifications(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY is_read ASC, created_at DESC LIMIT 30`,
      [auth.user.userId]
    );
    const unread = (result.rows as { is_read: boolean }[]).filter(n => !n.is_read).length;
    return NextResponse.json({ success: true, data: { notifications: result.rows, unread } });
  } catch (err) {
    console.error('Get notifications error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function markRead(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const notifId = parseInt(id);
  if (isNaN(notifId)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [notifId, auth.user.userId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function markAllRead(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [auth.user.userId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
