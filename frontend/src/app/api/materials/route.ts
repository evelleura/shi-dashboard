import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/materials - Add material (manager/admin)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, name, quantity, unit, unit_price, notes } = body;

  if (!project_id || !name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'project_id and name are required' }, { status: 400 });
  }

  const qty = parseFloat(quantity);
  if (quantity !== undefined && (isNaN(qty) || qty < 0)) {
    return NextResponse.json({ success: false, error: 'quantity must be a non-negative number' }, { status: 400 });
  }

  const price = parseFloat(unit_price);
  if (unit_price !== undefined && (isNaN(price) || price < 0)) {
    return NextResponse.json({ success: false, error: 'unit_price must be a non-negative number' }, { status: 400 });
  }

  try {
    const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const result = await query(
      `INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [project_id, name.trim(), qty || 1, unit || 'pcs', price || 0, notes || null]
    );

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create material error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
