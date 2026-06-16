import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { logChange } from './audit';
import path from 'path';
import fs from 'fs';

export async function listClients(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT c.*, u.name AS created_by_name, COUNT(p.id)::int AS project_count
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

export async function createClient(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, address, phone, email, notes, latitude, longitude } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Nama klien wajib diisi' }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO clients (name, address, phone, email, notes, latitude, longitude, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name.trim(),
        address || null,
        phone || null,
        email || null,
        notes || null,
        latitude != null ? Number(latitude) : null,
        longitude != null ? Number(longitude) : null,
        auth.user.userId,
      ]
    );
    const created = result.rows[0] as { id: number; name: string };
    const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'client',
      entityId: created.id,
      entityName: created.name,
      action: 'create',
      changes: [{ field: '*', oldValue: null, newValue: name.trim() }],
      userId: auth.user.userId,
      userName: actorName,
    });
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Create client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getClient(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const clientResult = await query(
      `SELECT c.*, u.name AS created_by_name FROM clients c LEFT JOIN users u ON u.id = c.created_by WHERE c.id = $1`,
      [clientId]
    );
    if (clientResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    const projectsResult = await query(
      `SELECT p.id, p.name, p.status, p.phase, p.start_date, p.end_date, p.project_value,
              ph.spi_value, ph.status AS health_status
       FROM projects p LEFT JOIN project_health ph ON ph.project_id = p.id
       WHERE p.client_id = $1 ORDER BY p.created_at DESC`,
      [clientId]
    );
    return NextResponse.json({ success: true, data: { ...clientResult.rows[0], projects: projectsResult.rows } });
  } catch (err) {
    console.error('Get client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateClient(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, address, phone, email, notes, latitude, longitude } = body;

  try {
    const current = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;
    const updatedName = (name !== undefined ? name : row.name) as string;
    if (!updatedName || updatedName.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Nama klien tidak boleh kosong' }, { status: 400 });
    }

    const fields: Record<string, unknown> = {
      name: updatedName.trim(),
      address: address !== undefined ? address : row.address,
      phone: phone !== undefined ? phone : row.phone,
      email: email !== undefined ? email : row.email,
      notes: notes !== undefined ? notes : row.notes,
      latitude: latitude !== undefined ? (latitude != null ? Number(latitude) : null) : row.latitude,
      longitude: longitude !== undefined ? (longitude != null ? Number(longitude) : null) : row.longitude,
    };

    const result = await query(
      `UPDATE clients SET name=$1, address=$2, phone=$3, email=$4, notes=$5,
       latitude=$6, longitude=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [fields.name, fields.address, fields.phone, fields.email, fields.notes,
       fields.latitude, fields.longitude, clientId]
    );

    const changes = Object.entries(fields)
      .filter(([f, newVal]) => String(row[f] ?? '') !== String(newVal ?? ''))
      .map(([f, newVal]) => ({ field: f, oldValue: row[f] != null ? String(row[f]) : null, newValue: newVal != null ? String(newVal) : null }));

    if (changes.length > 0) {
      const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
      await logChange({
        entityType: 'client',
        entityId: clientId,
        entityName: String(fields.name),
        action: 'update',
        changes,
        userId: auth.user.userId,
        userName: actorName,
      });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteClient(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['admin']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const existing = await query('SELECT name FROM clients WHERE id = $1', [clientId]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    const clientName = existing.rows[0].name as string;
    await query('DELETE FROM clients WHERE id = $1', [clientId]);
    const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      action: 'delete',
      changes: [{ field: '*', oldValue: clientName, newValue: null }],
      userId: auth.user.userId,
      userName: actorName,
    });
    return NextResponse.json({ success: true, message: 'Klien berhasil dihapus' });
  } catch (err) {
    console.error('Delete client error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function uploadClientPhoto(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const existing = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const ext = path.extname(file.name) || '.jpg';
    const fileName = `client_${clientId}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'clients');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/clients/${fileName}`;
    const result = await query(
      'UPDATE clients SET photo_path=$1, photo_name=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [relativePath, file.name, clientId]
    );

    const actorName = (await query('SELECT name FROM users WHERE id = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'client',
      entityId: clientId,
      entityName: existing.rows[0].name as string,
      action: 'update',
      changes: [{ field: 'photo', oldValue: (existing.rows[0].photo_name as string | null) ?? null, newValue: file.name }],
      userId: auth.user.userId,
      userName: actorName,
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Upload client photo error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
