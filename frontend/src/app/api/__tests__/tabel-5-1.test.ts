// Pengujian Black Box — Tabel 5.1 Naskah TA.
// Skenario diuji dengan memanggil route handler Next.js secara langsung.
// Membutuhkan PostgreSQL aktif pada DB_NAME=shi_test (lihat .env.test).
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieMock, loginSebagai } from '@/test/mock-cookies';

// vi.mock di-hoist ke atas file oleh vitest sebelum impor route handler.
vi.mock('next/headers', () => ({ cookies: async () => cookieMock }));

import { dbTersedia, setupTestData, PASSWORD_PLAINTEXT, type TestEntities } from '@/test/db-helper';

// ── Module under test ─────────────────────────────────────────────
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { GET  as mePOST } from '@/app/api/auth/me/route';
import { POST as proyekPOST, GET as proyekGET } from '@/app/api/projects/route';
import { PATCH as proyekPATCH } from '@/app/api/projects/[id]/route';
import { PATCH as tugasPATCH } from '@/app/api/tasks/[id]/route';
import { POST as laporanPOST } from '@/app/api/reports/route';
import { POST as eskalasiPOST, GET as eskalasiGET } from '@/app/api/escalations/route';
import { PATCH as eskalasiPATCH } from '@/app/api/escalations/[id]/route';
import { GET as dashboardGET } from '@/app/api/dashboard/route';

let tersedia = false;
let data: TestEntities;

beforeAll(async () => {
  tersedia = await dbTersedia();
  if (!tersedia) {
    // eslint-disable-next-line no-console
    console.warn('[INFO] PostgreSQL tidak tersedia — uji integrasi DB di-skip.');
  }
});

beforeEach(async () => {
  if (!tersedia) return;
  cookieMock.reset();
  data = await setupTestData();
});

function reqJSON(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const itDB = (name: string, fn: () => Promise<void>) =>
  it(name, async () => {
    if (!tersedia) return;
    await fn();
  });

// ────────────────────────────────────────────────────────────────────
describe('Tabel 5.1 — Pengujian Black Box Sistem', () => {

  // [1] Login valid
  itDB('1. Login dengan kredensial valid → sesi terbit & data user dikembalikan', async () => {
    const r = await loginPOST(reqJSON({
      email: 'manajer.uji@shi.co.id', password: PASSWORD_PLAINTEXT,
    }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.user.role).toBe('manager');
  });

  // [2] Login password salah
  itDB('2. Login dengan password salah → 401 + pesan "Kata sandi salah"', async () => {
    const r = await loginPOST(reqJSON({
      email: 'manajer.uji@shi.co.id', password: 'pasti-salah',
    }));
    expect(r.status).toBe(401);
    const j = await r.json();
    expect(j.error).toMatch(/sandi salah/i);
  });

  // [3] Login email tidak terdaftar
  itDB('3. Login email tidak terdaftar → 401 + pesan "Email tidak ditemukan"', async () => {
    const r = await loginPOST(reqJSON({
      email: 'tidakada@shi.co.id', password: 'apapun123',
    }));
    expect(r.status).toBe(401);
    const j = await r.json();
    expect(j.error).toMatch(/tidak ditemukan/i);
  });

  // [4] Manajer buat proyek lengkap
  itDB('4. Manajer membuat proyek baru dengan data lengkap → tersimpan', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await proyekPOST(reqJSON({
      nama_proyek: 'Proyek Baru', id_klien: data.klienId,
      start_date: '2026-06-20', end_date: '2026-07-20', phase: 'survey',
      category: 'instalasi', project_value: 5_000_000,
    }));
    expect(r.status).toBe(201);
    const j = await r.json();
    expect(j.id_proyek).toBeTypeOf('number');
  });

  // [5] Manajer buat proyek tanpa nama
  itDB('5. Manajer buat proyek tanpa nama → 400 validasi error', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await proyekPOST(reqJSON({
      nama_proyek: '', id_klien: data.klienId,
      start_date: '2026-06-20', end_date: '2026-07-20', phase: 'survey',
    }));
    expect(r.status).toBe(400);
  });

  // [6] Teknisi mencoba membuat proyek (hak akses)
  itDB('6. Teknisi mencoba membuat proyek → 403 Hanya manajer', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const r = await proyekPOST(reqJSON({
      nama_proyek: 'X', start_date: '2026-06-20', end_date: '2026-07-20',
    }));
    expect(r.status).toBe(403);
  });

  // [7] Teknisi membuat laporan harian + memicu SPI
  itDB('7. Teknisi mengirim laporan harian → SPI direkalkulasi & laporan tersimpan', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const r = await laporanPOST(reqJSON({
      project_id: data.proyekId, task_id: data.tugasId,
      progress_percentage: 40, constraints: 'Kabel kurang panjang',
    }));
    expect(r.status).toBe(201);
    const { query } = await import('@/lib/db');
    const ph = await query('SELECT spi_value, status FROM project_health WHERE project_id = $1', [data.proyekId]);
    expect(ph.rows.length).toBeGreaterThan(0);
  });

  // [8] Laporan tanpa ubah status tugas
  itDB('8. Laporan harian tidak mengubah status tugas yang sudah ada', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    await laporanPOST(reqJSON({ project_id: data.proyekId, progress_percentage: 50 }));
    const { query } = await import('@/lib/db');
    const t = await query('SELECT status FROM tb_tugas WHERE id_tugas = $1', [data.tugasId]);
    expect(t.rows[0].status).toBe('to_do');
  });

  // [9] Teknisi mengubah status to_do → working_on
  itDB('9. Teknisi mengubah status tugas to_do → working_on → 200', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const r = await tugasPATCH(reqJSON({ status: 'working_on' }), {
      params: Promise.resolve({ id: String(data.tugasId) }),
    });
    expect(r.status).toBe(200);
  });

  // [10] Dashboard EWS proyek red di atas
  itDB('10. Dashboard EWS — proyek RAG red muncul di urutan teratas', async () => {
    // Set kondisi: proyek demo menjadi red (SPI 0.5).
    const { query } = await import('@/lib/db');
    await query(
      `INSERT INTO project_health (project_id, spi_value, status, actual_progress, planned_progress, total_tasks)
       VALUES ($1, 0.5, 'red', 30, 60, 5)
       ON CONFLICT (project_id) DO UPDATE SET spi_value=EXCLUDED.spi_value, status=EXCLUDED.status`,
      [data.proyekId],
    );
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await dashboardGET();
    const j = await r.json();
    expect(j.role).toBe('manager');
    expect(j.proyek[0].rag).toBe('red');
  });

  // [11] SPI dihitung otomatis pasca task status berubah
  itDB('11. SPI dihitung otomatis ketika status tugas berubah ke done', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    await tugasPATCH(reqJSON({ status: 'done' }), {
      params: Promise.resolve({ id: String(data.tugasId) }),
    });
    const { query } = await import('@/lib/db');
    const ph = await query<{ completed_tasks: number; total_tasks: number; spi_value: string }>(
      'SELECT completed_tasks, total_tasks, spi_value FROM project_health WHERE project_id = $1',
      [data.proyekId],
    );
    expect(ph.rows[0].completed_tasks).toBe(1);
    expect(ph.rows[0].total_tasks).toBe(1);
  });

  // [12] Teknisi mengajukan eskalasi
  itDB('12. Teknisi mengajukan eskalasi → 201 + tersimpan dengan status "open"', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const r = await eskalasiPOST(reqJSON({
      id_tugas: data.tugasId, title: 'Kabel rusak',
      description: 'Membutuhkan penggantian kabel utama', priority: 'high',
    }));
    expect(r.status).toBe(201);
    const list = await eskalasiGET();
    const j = await list.json();
    expect(j.escalations.length).toBe(1);
    expect(j.escalations[0].status).toBe('open');
  });

  // [13] Manajer mengirim instruksi eskalasi → status ditangani
  itDB('13. Manajer mengirim instruksi eskalasi → status berubah jadi "ditangani"', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const buat = await eskalasiPOST(reqJSON({
      id_tugas: data.tugasId, title: 'X', description: 'Y', priority: 'medium',
    }));
    const idEsk = (await buat.json()).id_eskalasi;
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await eskalasiPATCH(reqJSON({ instruksi: 'Ganti dengan kabel cadangan' }), {
      params: Promise.resolve({ id: String(idEsk) }),
    });
    expect(r.status).toBe(200);
    const { query } = await import('@/lib/db');
    const c = await query<{ status: string; instruksi: string }>(
      'SELECT status, instruksi FROM tb_eskalasi WHERE id_eskalasi = $1', [idEsk],
    );
    expect(c.rows[0].status).toBe('ditangani');
    expect(c.rows[0].instruksi).toMatch(/cadangan/);
  });

  // [14] Logout
  itDB('14. Logout → sesi cookie dihapus & /me kembali 401', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    await logoutPOST();
    const r = await mePOST();
    expect(r.status).toBe(401);
  });

  // [15] Daftar proyek terurut berdasarkan kekritisan
  itDB('15. Daftar proyek manajer menyertakan field health_status & spi_value', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await proyekGET();
    const j = await r.json();
    expect(Array.isArray(j.projects)).toBe(true);
    expect(j.projects[0]).toHaveProperty('health_status');
    expect(j.projects[0]).toHaveProperty('spi_value');
  });
});

// ────────────────────────────────────────────────────────────────────
// Pengujian Negatif Tambahan — sering ditanyakan dosen penguji.
// ────────────────────────────────────────────────────────────────────
describe('Pengujian Negatif Tambahan', () => {

  itDB('N1. Login dengan JSON kosong → 400', async () => {
    const r = await loginPOST(new Request('http://localhost/x', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '',
    }));
    expect(r.status).toBe(400);
  });

  itDB('N2. Email kosong → 400 "wajib diisi"', async () => {
    const r = await loginPOST(reqJSON({ email: '', password: 'apapun' }));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/wajib diisi/i);
  });

  itDB('N3. Upaya SQL injection pada email tidak meretas sistem', async () => {
    const r = await loginPOST(reqJSON({
      email: "' OR '1'='1' --", password: 'apapun',
    }));
    expect(r.status).toBe(401); // ditolak normal, tidak 500
  });

  itDB('N4. Tugas: teknisi tidak boleh mengubah tugas milik teknisi lain → 403', async () => {
    loginSebagai({ id: data.teknisi2Id, email: 'teknisi2@shi.co.id', nama: 'Teknisi Dua', role: 'technician' });
    const r = await tugasPATCH(reqJSON({ status: 'working_on' }), {
      params: Promise.resolve({ id: String(data.tugasId) }),
    });
    expect(r.status).toBe(403);
  });

  itDB('N5. Teknisi DILARANG menandai tugas selesai (done) — review gate manajer', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const r = await tugasPATCH(reqJSON({ status: 'done' }), {
      params: Promise.resolve({ id: String(data.tugasId) }),
    });
    expect(r.status).toBe(403);
    expect((await r.json()).error).toMatch(/menandai selesai/i);
  });

  itDB('N6. Tugas: status tidak valid ditolak → 400', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await tugasPATCH(reqJSON({ status: 'super_done' }), {
      params: Promise.resolve({ id: String(data.tugasId) }),
    });
    expect(r.status).toBe(400);
  });

  itDB('N7. Proyek: tanggal akhir lebih awal dari tanggal mulai → 400', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await proyekPOST(reqJSON({
      nama_proyek: 'X', start_date: '2026-07-10', end_date: '2026-06-10',
    }));
    expect(r.status).toBe(400);
  });

  itDB('N8. Approve survey memindahkan fase survey → execution', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const buat = await proyekPOST(reqJSON({
      nama_proyek: 'Proyek Survei', id_klien: data.klienId,
      start_date: '2026-06-20', end_date: '2026-07-20', phase: 'survey',
    }));
    const idP = (await buat.json()).id_proyek;
    const r = await proyekPATCH(reqJSON({ approveSurvey: true }), {
      params: Promise.resolve({ id: String(idP) }),
    });
    expect(r.status).toBe(200);
    const { query } = await import('@/lib/db');
    const c = await query<{ phase: string }>('SELECT phase FROM tb_proyek WHERE id_proyek = $1', [idP]);
    expect(c.rows[0].phase).toBe('execution');
  });

  itDB('N9. Laporan: progres > 100 ditolak → 400', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const r = await laporanPOST(reqJSON({ project_id: data.proyekId, progress_percentage: 150 }));
    expect(r.status).toBe(400);
  });

  itDB('N10. Eskalasi: prioritas tidak valid ditolak → 400', async () => {
    loginSebagai({ id: data.teknisiId, email: 'teknisi.uji@shi.co.id', nama: 'Teknisi Uji', role: 'technician' });
    const r = await eskalasiPOST(reqJSON({
      id_tugas: data.tugasId, title: 'A', description: 'B', priority: 'super-darurat',
    }));
    expect(r.status).toBe(400);
  });

  itDB('N11. Akses /api/dashboard tanpa login → 401', async () => {
    cookieMock.reset();
    const r = await dashboardGET();
    expect(r.status).toBe(401);
  });

  itDB('N12. Akses proyek dengan ID non-numerik → 400', async () => {
    loginSebagai({ id: data.managerId, email: 'manajer.uji@shi.co.id', nama: 'Manajer Uji', role: 'manager' });
    const r = await proyekPATCH(reqJSON({ nama_proyek: 'X' }), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(r.status).toBe(400);
  });
});
