// POST /api/evidence — unggah bukti pekerjaan untuk satu tugas.
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { query } from '@/lib/db';
import { getSesi } from '@/lib/session';

const FOLDER = path.join(process.cwd(), 'uploads');
const TIPE_DIIZINKAN = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
]);
const MAKS_BYTE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const u = await getSesi();
  if (!u) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Format unggah tidak valid' }, { status: 400 });
  }
  const idTugas = Number(form.get('id_tugas'));
  const file = form.get('file');
  if (!Number.isFinite(idTugas)) return NextResponse.json({ error: 'id_tugas wajib' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: 'Berkas wajib diunggah' }, { status: 400 });
  if (!TIPE_DIIZINKAN.has(file.type)) {
    return NextResponse.json({ error: 'Tipe berkas tidak didukung' }, { status: 415 });
  }
  if (file.size > MAKS_BYTE) {
    return NextResponse.json({ error: 'Ukuran berkas melebihi 5 MB' }, { status: 413 });
  }

  // Pastikan tugas eksis.
  const cek = await query('SELECT 1 FROM tb_tugas WHERE id_tugas = $1', [idTugas]);
  if (cek.rows.length === 0) {
    return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
  }

  await mkdir(FOLDER, { recursive: true });
  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase();
  const safeName = `${idTugas}-${Date.now()}.${ext}`;
  const target = path.join(FOLDER, safeName);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(target, buf);

  const r = await query<{ id_bukti: number }>(
    `INSERT INTO tb_bukti (id_tugas, file_path, file_name, file_type, file_size, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_bukti`,
    [idTugas, `/uploads/${safeName}`, file.name, file.type, file.size, u.id],
  );
  return NextResponse.json({ ok: true, id_bukti: r.rows[0].id_bukti }, { status: 201 });
}
