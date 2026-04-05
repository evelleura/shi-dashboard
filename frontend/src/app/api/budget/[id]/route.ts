import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// PATCH /api/budget/:id - Update budget item (manager/admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const budgetId = parseInt(id);
  if (isNaN(budgetId)) {
    return NextResponse.json({ success: false, error: 'Invalid budget item ID' }, { status: 400 });
  }

  const body = await request.json();
  const { category, description, amount, is_actual } = body;

  try {
    const current = await query('SELECT * FROM budget_items WHERE id = $1', [budgetId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Budget item not found' }, { status: 404 });
    }

    const row = current.rows[0] as Record<string, unknown>;

    const updatedCategory = category !== undefined ? category : row.category;
    const updatedDesc = description !== undefined ? description : row.description;
    const updatedAmount = amount !== undefined ? parseFloat(amount) : row.amount;
    const updatedIsActual = is_actual !== undefined ? is_actual : row.is_actual;

    if (!updatedCategory || String(updatedCategory).trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Category cannot be empty' }, { status: 400 });
    }

    if (typeof updatedAmount === 'number' && (isNaN(updatedAmount) || updatedAmount < 0)) {
      return NextResponse.json({ success: false, error: 'amount must be a non-negative number' }, { status: 400 });
    }

    const result = await query(
      `UPDATE budget_items SET category = $1, description = $2, amount = $3, is_actual = $4
       WHERE id = $5
       RETURNING *`,
      [String(updatedCategory).trim(), updatedDesc, updatedAmount, updatedIsActual, budgetId]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update budget item error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/budget/:id - Delete budget item (manager/admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const budgetId = parseInt(id);
  if (isNaN(budgetId)) {
    return NextResponse.json({ success: false, error: 'Invalid budget item ID' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM budget_items WHERE id = $1 RETURNING id', [budgetId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Budget item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Budget item deleted successfully' });
  } catch (err) {
    console.error('Delete budget item error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
