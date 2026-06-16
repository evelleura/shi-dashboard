// Utilitas akses basis data uji. Skip otomatis jika database tidak tersedia.
import { pool, query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function dbTersedia(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

const PASSWORD_PLAINTEXT = 'password123';
const PASSWORD_HASH = '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6';

export interface TestEntities {
  managerId: number;
  teknisiId: number;
  teknisi2Id: number;
  klienId: number;
  proyekId: number;
  tugasId: number;
}

export async function setupTestData(): Promise<TestEntities> {
  // Bersihkan dalam urutan FK aman.
  await query('DELETE FROM tb_eskalasi');
  await query('DELETE FROM tb_bukti');
  await query('DELETE FROM task_activities');
  await query('DELETE FROM tb_tugas');
  await query('DELETE FROM daily_reports');
  await query('DELETE FROM project_health');
  await query('DELETE FROM tb_penugasan_proyek');
  await query('DELETE FROM tb_proyek');
  await query('DELETE FROM tb_klien');
  await query('DELETE FROM tb_user');

  // Re-seed dengan data minimal.
  const manager = await query<{ id_user: number }>(
    `INSERT INTO tb_user (nama, email, password, role) VALUES ($1,$2,$3,'manager') RETURNING id_user`,
    ['Manajer Uji', 'manajer.uji@shi.co.id', PASSWORD_HASH],
  );
  const teknisi = await query<{ id_user: number }>(
    `INSERT INTO tb_user (nama, email, password, role) VALUES ($1,$2,$3,'technician') RETURNING id_user`,
    ['Teknisi Uji', 'teknisi.uji@shi.co.id', PASSWORD_HASH],
  );
  const teknisi2 = await query<{ id_user: number }>(
    `INSERT INTO tb_user (nama, email, password, role) VALUES ($1,$2,$3,'technician') RETURNING id_user`,
    ['Teknisi Dua', 'teknisi2@shi.co.id', PASSWORD_HASH],
  );

  const klien = await query<{ id_klien: number }>(
    `INSERT INTO tb_klien (nama_klien, alamat, no_telp, email, id_user)
     VALUES ('Klien Uji','Jl. Tes 1','08111111','klien.uji@example.com',$1) RETURNING id_klien`,
    [manager.rows[0].id_user],
  );

  const proyek = await query<{ id_proyek: number }>(
    `INSERT INTO tb_proyek (nama_proyek, id_klien, start_date, end_date, status, phase, id_user,
                            project_code, created_by)
     VALUES ('Proyek Uji', $1, CURRENT_DATE - 5, CURRENT_DATE + 5, 'active', 'execution', $2, 'PRJ-UJI', $2)
     RETURNING id_proyek`,
    [klien.rows[0].id_klien, manager.rows[0].id_user],
  );

  await query(
    `INSERT INTO tb_penugasan_proyek (id_proyek, id_user) VALUES ($1, $2), ($1, $3)`,
    [proyek.rows[0].id_proyek, teknisi.rows[0].id_user, teknisi2.rows[0].id_user],
  );

  const tugas = await query<{ id_tugas: number }>(
    `INSERT INTO tb_tugas (id_proyek, id_user, nama_tugas, due_date, status, created_by)
     VALUES ($1,$2,'Tugas Uji',CURRENT_DATE + 2,'to_do',$3) RETURNING id_tugas`,
    [proyek.rows[0].id_proyek, teknisi.rows[0].id_user, manager.rows[0].id_user],
  );

  return {
    managerId: manager.rows[0].id_user,
    teknisiId: teknisi.rows[0].id_user,
    teknisi2Id: teknisi2.rows[0].id_user,
    klienId: klien.rows[0].id_klien,
    proyekId: proyek.rows[0].id_proyek,
    tugasId: tugas.rows[0].id_tugas,
  };
}

export { PASSWORD_PLAINTEXT, PASSWORD_HASH, bcrypt };
