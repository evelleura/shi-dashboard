import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { logChange } from './audit';
import path from 'path';
import fs from 'fs';

// Kolom tb_klien di-alias balik ke nama JS (id, name, address, phone) supaya
// lapisan UI/tipe tidak berubah. Tabel fisik pakai nama naskah (Tabel 4.10).
const KLIEN_COLS = `c.id_klien AS id, c.nama_klien AS name, c.alamat AS address,
  c.no_telp AS phone, c.email, c.notes, c.latitude, c.longitude,
  c.photo_path, c.photo_name, c.created_by, c.created_at, c.updated_at`;

export async function listClients(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  try {
    const result = await query(
      `SELECT ${KLIEN_COLS}, u.nama AS created_by_name, COUNT(p.id_proyek)::int AS project_count
       FROM tb_klien c
       LEFT JOIN tb_user u ON u.id_user = c.created_by
       LEFT JOIN tb_proyek p ON p.id_klien = c.id_klien
       GROUP BY c.id_klien, u.nama
       ORDER BY c.nama_klien ASC`
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, address, phone, email, notes, latitude, longitude } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Nama klien wajib diisi' }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO tb_klien (nama_klien, alamat, no_telp, email, notes, latitude, longitude, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_klien AS id, nama_klien AS name, alamat AS address, no_telp AS phone,
         email, notes, latitude, longitude, photo_path, photo_name, created_by, created_at, updated_at`,
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
    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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
      `SELECT ${KLIEN_COLS}, u.nama AS created_by_name
       FROM tb_klien c LEFT JOIN tb_user u ON u.id_user = c.created_by WHERE c.id_klien = $1`,
      [clientId]
    );
    if (clientResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    const projectsResult = await query(
      `SELECT p.id_proyek AS id, p.nama_proyek AS name, p.status, p.phase, p.start_date, p.end_date, p.project_value,
              ph.spi_value, ph.status AS health_status
       FROM tb_proyek p LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
       WHERE p.id_klien = $1 ORDER BY p.created_at DESC`,
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, address, phone, email, notes, latitude, longitude } = body;

  try {
    const current = await query(
      `SELECT id_klien AS id, nama_klien AS name, alamat AS address, no_telp AS phone,
        email, notes, latitude, longitude, photo_path, photo_name, created_by, created_at, updated_at
       FROM tb_klien WHERE id_klien = $1`,
      [clientId]
    );
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
      `UPDATE tb_klien SET nama_klien=$1, alamat=$2, no_telp=$3, email=$4, notes=$5,
       latitude=$6, longitude=$7, updated_at=NOW()
       WHERE id_klien=$8
       RETURNING id_klien AS id, nama_klien AS name, alamat AS address, no_telp AS phone,
         email, notes, latitude, longitude, photo_path, photo_name, created_by, created_at, updated_at`,
      [fields.name, fields.address, fields.phone, fields.email, fields.notes,
       fields.latitude, fields.longitude, clientId]
    );

    const changes = Object.entries(fields)
      .filter(([f, newVal]) => String(row[f] ?? '') !== String(newVal ?? ''))
      .map(([f, newVal]) => ({ field: f, oldValue: row[f] != null ? String(row[f]) : null, newValue: newVal != null ? String(newVal) : null }));

    if (changes.length > 0) {
      const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const clientId = parseInt(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ success: false, error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const existing = await query('SELECT nama_klien AS name FROM tb_klien WHERE id_klien = $1', [clientId]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    const clientName = existing.rows[0].name as string;
    await query('DELETE FROM tb_klien WHERE id_klien = $1', [clientId]);
    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
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

    const existing = await query('SELECT nama_klien AS name, photo_name FROM tb_klien WHERE id_klien = $1', [clientId]);
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
      `UPDATE tb_klien SET photo_path=$1, photo_name=$2, updated_at=NOW() WHERE id_klien=$3
       RETURNING id_klien AS id, nama_klien AS name, alamat AS address, no_telp AS phone,
         email, notes, latitude, longitude, photo_path, photo_name, created_by, created_at, updated_at`,
      [relativePath, file.name, clientId]
    );

    const actorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
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
