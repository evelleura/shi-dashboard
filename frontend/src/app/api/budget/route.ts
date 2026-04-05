import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/budget - Add budget item (manager/admin)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { project_id, category, description, amount, is_actual } = body;

  if (!project_id || !category || typeof category !== 'string' || category.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'project_id and category are required' }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (amount === undefined || isNaN(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json({ success: false, error: 'amount must be a non-negative number' }, { status: 400 });
  }

  try {
    const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const result = await query(
      `INSERT INTO budget_items (project_id, category, description, amount, is_actual)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [project_id, category.trim(), description || null, parsedAmount, is_actual || false]
    );

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create budget item error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
