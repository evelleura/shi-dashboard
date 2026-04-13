import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

export async function createMaterial(request: NextRequest) {
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
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [project_id, name.trim(), qty || 1, unit || 'pcs', price || 0, notes || null]
    );
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create material error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateMaterial(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const materialId = parseInt(id);
  if (isNaN(materialId)) {
    return NextResponse.json({ success: false, error: 'Invalid material ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, quantity, unit, unit_price, notes } = body;

  try {
    const current = await query('SELECT * FROM materials WHERE id = $1', [materialId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;
    const updatedName = name !== undefined ? name : row.name;
    const updatedQty = quantity !== undefined ? parseFloat(quantity) : row.quantity;
    const updatedUnit = unit !== undefined ? unit : row.unit;
    const updatedPrice = unit_price !== undefined ? parseFloat(unit_price) : row.unit_price;
    const updatedNotes = notes !== undefined ? notes : row.notes;

    if (!updatedName || String(updatedName).trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Material name cannot be empty' }, { status: 400 });
    }
    if (typeof updatedQty === 'number' && (isNaN(updatedQty) || updatedQty < 0)) {
      return NextResponse.json({ success: false, error: 'quantity must be a non-negative number' }, { status: 400 });
    }
    if (typeof updatedPrice === 'number' && (isNaN(updatedPrice) || updatedPrice < 0)) {
      return NextResponse.json({ success: false, error: 'unit_price must be a non-negative number' }, { status: 400 });
    }

    const result = await query(
      `UPDATE materials SET name=$1, quantity=$2, unit=$3, unit_price=$4, notes=$5 WHERE id=$6 RETURNING *`,
      [String(updatedName).trim(), updatedQty, updatedUnit, updatedPrice, updatedNotes, materialId]
    );
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update material error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteMaterial(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const materialId = parseInt(id);
  if (isNaN(materialId)) {
    return NextResponse.json({ success: false, error: 'Invalid material ID' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM materials WHERE id = $1 RETURNING id', [materialId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    console.error('Delete material error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getMaterialsByProject(request: NextRequest, projectId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(projectId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const result = await query('SELECT * FROM materials WHERE project_id = $1 ORDER BY created_at ASC', [id]);
    const totals = await query<{ total_items: string; total_cost: string }>(
      `SELECT COUNT(*)::int AS total_items, COALESCE(SUM(total_price), 0)::numeric AS total_cost
       FROM materials WHERE project_id = $1`,
      [id]
    );
    return NextResponse.json({
      success: true,
      data: {
        materials: result.rows,
        total_items: parseInt(String(totals.rows[0].total_items)) || 0,
        total_cost: parseFloat(String(totals.rows[0].total_cost)) || 0,
      },
    });
  } catch (err) {
    console.error('Get materials error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
