import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

export async function createBudgetItem(request: NextRequest) {
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
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [project_id, category.trim(), description || null, parsedAmount, is_actual || false]
    );
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create budget item error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateBudgetItem(request: NextRequest, id: string) {
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
    const updatedAmount = amount !== undefined ? parseFloat(amount) : row.amount;

    if (!updatedCategory || String(updatedCategory).trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Category cannot be empty' }, { status: 400 });
    }
    if (typeof updatedAmount === 'number' && (isNaN(updatedAmount) || updatedAmount < 0)) {
      return NextResponse.json({ success: false, error: 'amount must be a non-negative number' }, { status: 400 });
    }

    const result = await query(
      `UPDATE budget_items SET category=$1, description=$2, amount=$3, is_actual=$4 WHERE id=$5 RETURNING *`,
      [
        String(updatedCategory).trim(),
        description !== undefined ? description : row.description,
        updatedAmount,
        is_actual !== undefined ? is_actual : row.is_actual,
        budgetId,
      ]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update budget item error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteBudgetItem(request: NextRequest, id: string) {
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

export async function getBudgetByProject(request: NextRequest, projectId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(projectId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const result = await query(
      'SELECT * FROM budget_items WHERE project_id = $1 ORDER BY is_actual ASC, category ASC, created_at ASC', [id]
    );
    const summaryResult = await query<{ planned_total: string; actual_total: string }>(
      `SELECT COALESCE(SUM(amount) FILTER (WHERE is_actual = false), 0)::numeric AS planned_total,
              COALESCE(SUM(amount) FILTER (WHERE is_actual = true), 0)::numeric AS actual_total
       FROM budget_items WHERE project_id = $1`,
      [id]
    );
    const categoryResult = await query(
      `SELECT category,
        COALESCE(SUM(amount) FILTER (WHERE is_actual = false), 0)::numeric AS planned,
        COALESCE(SUM(amount) FILTER (WHERE is_actual = true), 0)::numeric AS actual
       FROM budget_items WHERE project_id = $1 GROUP BY category ORDER BY category ASC`,
      [id]
    );
    const summary = summaryResult.rows[0];
    const plannedTotal = parseFloat(String(summary.planned_total)) || 0;
    const actualTotal = parseFloat(String(summary.actual_total)) || 0;
    return NextResponse.json({
      success: true,
      data: {
        items: result.rows,
        summary: { planned_total: plannedTotal, actual_total: actualTotal, variance: plannedTotal - actualTotal, by_category: categoryResult.rows },
      },
    });
  } catch (err) {
    console.error('Get budget items error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
