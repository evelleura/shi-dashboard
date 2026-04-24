import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// Helper: log a change (call from other handlers)
export async function logChange(opts: {
  entityType: string;
  entityId: number;
  entityName: string;
  action: string;
  changes: { field: string; oldValue: string | null; newValue: string | null }[];
  userId: number;
  userName: string;
}) {
  for (const c of opts.changes) {
    await query(
      `INSERT INTO audit_log (entity_type, entity_id, entity_name, action, field_name, old_value, new_value, changed_by, changed_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [opts.entityType, opts.entityId, opts.entityName, opts.action, c.field, c.oldValue, c.newValue, opts.userId, opts.userName]
    );
  }
}

// GET /api/audit - list audit logs
export async function listAuditLogs(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const params = request.nextUrl.searchParams;
  const entityType = params.get('entity_type');
  const entityId = params.get('entity_id');
  const limit = Math.min(parseInt(params.get('limit') || '50'), 200);
  const offset = parseInt(params.get('offset') || '0');

  try {
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const vals: unknown[] = [];
    let idx = 1;

    if (entityType) { sql += ` AND entity_type = $${idx++}`; vals.push(entityType); }
    if (entityId) { sql += ` AND entity_id = $${idx++}`; vals.push(parseInt(entityId)); }

    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    vals.push(limit, offset);

    const result = await query(sql, vals);

    // Get total count
    let countSql = 'SELECT COUNT(*)::int AS total FROM audit_log WHERE 1=1';
    const countVals: unknown[] = [];
    let ci = 1;
    if (entityType) { countSql += ` AND entity_type = $${ci++}`; countVals.push(entityType); }
    if (entityId) { countSql += ` AND entity_id = $${ci++}`; countVals.push(parseInt(entityId)); }
    const countResult = await query(countSql, countVals);

    return NextResponse.json({
      success: true,
      data: { logs: result.rows, total: (countResult.rows[0] as Record<string, unknown>).total },
    });
  } catch (err) {
    console.error('Audit log error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
