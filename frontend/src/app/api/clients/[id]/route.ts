import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/clients/:id - Get single client with projects
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const clientResult = await query(
      `SELECT c.*, u.name AS created_by_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [clientId]
    );

    if (clientResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const projectsResult = await query(
      `SELECT p.id, p.name, p.status, p.phase, p.start_date, p.end_date, p.project_value,
              ph.spi_value, ph.status AS health_status
       FROM projects p
       LEFT JOIN project_health ph ON ph.project_id = p.id
       WHERE p.client_id = $1
       ORDER BY p.created_at DESC`,
      [clientId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...clientResult.rows[0],
        projects: projectsResult.rows,
      },
    });
  } catch (err) {
    console.error('Get client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/clients/:id - Update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, address, phone, email, notes } = body;

  try {
    const current = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const row = current.rows[0] as Record<string, unknown>;
    const updatedName = (name !== undefined ? name : row.name) as string;
    const updatedAddress = address !== undefined ? address : row.address;
    const updatedPhone = phone !== undefined ? phone : row.phone;
    const updatedEmail = email !== undefined ? email : row.email;
    const updatedNotes = notes !== undefined ? notes : row.notes;

    if (!updatedName || updatedName.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Client name cannot be empty' }, { status: 400 });
    }

    const result = await query(
      `UPDATE clients
       SET name = $1, address = $2, phone = $3, email = $4, notes = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [updatedName.trim(), updatedAddress, updatedPhone, updatedEmail, updatedNotes, clientId]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/clients/:id - Delete client (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM clients WHERE id = $1 RETURNING id', [clientId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
