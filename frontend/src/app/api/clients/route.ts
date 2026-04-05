import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/clients - List all clients with project count
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT c.*,
        u.name AS created_by_name,
        COUNT(p.id)::int AS project_count
      FROM clients c
      LEFT JOIN users u ON u.id = c.created_by
      LEFT JOIN projects p ON p.client_id = c.id
      GROUP BY c.id, u.name
      ORDER BY c.name ASC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get clients error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/clients - Create client
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, address, phone, email, notes } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Client name is required' }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO clients (name, address, phone, email, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name.trim(), address || null, phone || null, email || null, notes || null, auth.user.userId]
    );

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
