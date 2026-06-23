process.env.DB_NAME = 'shi_test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '5433';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.JWT_SECRET = 'SecretDian';


import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import {
  calculatePlannedValue,
  categorizeHealth,
  computeTechnicianSPI,
  SPI_CAP,
  recalculateSPI,
} from '../spiCalculator';

const testPool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'shi_test',
  user: 'postgres',
  password: 'postgres',
});

let managerId: number;
let projectId: number;

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE tb_bukti, task_activities, audit_log, daily_reports, project_health,
      tb_tugas, tb_penugasan_proyek, tb_proyek, tb_klien, tb_user
    RESTART IDENTITY CASCADE
  `);
  const hash = await bcrypt.hash('pw', 10);
  const mgr = await testPool.query(
    `INSERT INTO tb_user (nama, email, role, password) VALUES ($1,$2,$3,$4) RETURNING id_user AS id`,
    ['Manager', 'mgr@t.com', 'manajer', hash]
  );
  managerId = mgr.rows[0].id;

  const proj = await testPool.query(
    `INSERT INTO tb_proyek (nama_proyek, start_date, end_date, status, phase, category, project_value, survey_approved, created_by)
     VALUES ($1,'2020-01-01','2020-12-31','active','execution','instalasi',5000000,TRUE,$2) RETURNING id_proyek AS id`,
    ['Test Project', managerId]
  );
  projectId = proj.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('calculatePlannedValue', () => {
  it('returns 0 when reference is at start date', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2020-12-31');
    const ref = new Date('2020-01-01');
    const pv = calculatePlannedValue(start, end, ref);
    expect(pv).toBe(0);
  });

  it('returns 100 when reference is at end date', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2020-12-31');
    const ref = new Date('2020-12-31');
    const pv = calculatePlannedValue(start, end, ref);
    expect(pv).toBe(100);
  });

  it('returns 100 when reference is after end date', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2020-12-31');
    const ref = new Date('2025-01-01');
    const pv = calculatePlannedValue(start, end, ref);
    expect(pv).toBe(100);
  });

  it('returns 0 when reference is before start date', () => {
    const start = new Date('2030-01-01');
    const end = new Date('2030-12-31');
    const ref = new Date('2025-01-01');
    const pv = calculatePlannedValue(start, end, ref);
    expect(pv).toBe(0);
  });

  it('returns approximately 50 at midpoint', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2020-12-31');
    // Midpoint approximately July 2
    const ref = new Date('2020-07-02');
    const pv = calculatePlannedValue(start, end, ref);
    expect(pv).toBeGreaterThan(49);
    expect(pv).toBeLessThan(51);
  });

  it('returns 100 when start equals end', () => {
    const start = new Date('2020-06-01');
    const end = new Date('2020-06-01');
    const ref = new Date('2020-06-01');
    const pv = calculatePlannedValue(start, end, ref);
    expect(pv).toBe(100);
  });

  it('uses current date when no reference provided', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2020-12-31');
    const pv = calculatePlannedValue(start, end);
    // Should be 100 since 2020 is in the past
    expect(pv).toBe(100);
  });
});

describe('categorizeHealth', () => {
  it('returns green for SPI >= 0.95', () => {
    expect(categorizeHealth(0.95)).toBe('green');
    expect(categorizeHealth(1.0)).toBe('green');
    expect(categorizeHealth(1.5)).toBe('green');
  });

  it('returns amber for 0.85 <= SPI < 0.95', () => {
    expect(categorizeHealth(0.85)).toBe('amber');
    expect(categorizeHealth(0.90)).toBe('amber');
    expect(categorizeHealth(0.94)).toBe('amber');
  });

  it('returns red for SPI < 0.85', () => {
    expect(categorizeHealth(0.84)).toBe('red');
    expect(categorizeHealth(0.5)).toBe('red');
    expect(categorizeHealth(0)).toBe('red');
  });
});

// SPI per-teknisi: fungsi MURNI (earned/planned), tak menyentuh DB.
describe('computeTechnicianSPI', () => {
  it('returns null (Belum Dinilai) when planned <= 0 -- tak ada dasar jadwal', () => {
    expect(computeTechnicianSPI(0, 0)).toEqual({ spi_value: null, status: null });
    expect(computeTechnicianSPI(3, 0)).toEqual({ spi_value: null, status: null });
  });

  it('on-pace (earned == planned) -> SPI 1.0 hijau', () => {
    const r = computeTechnicianSPI(5, 5);
    expect(r.spi_value).toBe(1);
    expect(r.status).toBe('green');
  });

  it('behind schedule (earned < planned) -> SPI < 0.85 merah', () => {
    // 5 selesai vs 6.6 yang seharusnya -> 0.7576
    const r = computeTechnicianSPI(5, 6.6);
    expect(r.spi_value).toBeCloseTo(0.7576, 3);
    expect(r.status).toBe('red');
  });

  it('caps SPI at SPI_CAP (tak ada angka absurd saat planned kecil)', () => {
    const r = computeTechnicianSPI(10, 1);
    expect(r.spi_value).toBe(SPI_CAP);
    expect(r.status).toBe('green');
  });
});

describe('recalculateSPI', () => {
  it('returns null for non-existent project', async () => {
    const result = await recalculateSPI(99999);
    expect(result).toBeNull();
  });

  it('treats a project with no tasks as Belum Dinilai (null SPI/status) - not 0, not fake-1', async () => {
    // Proyek tanpa tugas & tanpa laporan -> tak ada dasar EV -> Belum Dinilai (null).
    // Bukan kritis (SPI 0) maupun angka palsu (SPI 1). Regresi bug "SPI proyek baru".
    const result = await recalculateSPI(projectId);
    expect(result).not.toBeNull();
    expect(result?.spi_value).toBeNull();
    expect(result?.status).toBeNull();
    expect(result?.total_tasks).toBe(0);
  });

  it('caps SPI at 2.0 for a barely-started project (no absurd values like 10)', async () => {
    // Proyek baru mulai (~10% durasi) tapi tugas selesai -> EV/PV ~10 -> harus di-cap 2.0.
    const start = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    await testPool.query('UPDATE tb_proyek SET start_date=$1, end_date=$2 WHERE id_proyek=$3', [start, end, projectId]);
    await testPool.query(
      `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, created_by)
       VALUES ($1,'T done','done',CURRENT_DATE,0,FALSE,$2)`,
      [projectId, managerId]
    );
    const result = await recalculateSPI(projectId);
    expect(result?.spi_value).not.toBeNull();
    expect(Number(result?.spi_value)).toBeLessThanOrEqual(2);
    expect(result?.status).toBe('green');
  });

  it('calculates correct SPI with tasks', async () => {
    const due = '2020-06-30';
    // Create 4 tasks: 2 done, 2 to_do
    for (let i = 0; i < 4; i++) {
      const status = i < 2 ? 'done' : 'to_do';
      await testPool.query(
        `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,$2,$3,$4,$5,FALSE,$6)`,
        [projectId, `Task ${i + 1}`, status, due, i, managerId]
      );
    }

    const result = await recalculateSPI(projectId);
    expect(result).not.toBeNull();
    expect(result?.total_tasks).toBe(4);
    expect(result?.completed_tasks).toBe(2);
    // actual_progress = 2/4 * 100 = 50
    expect(result?.actual_progress).toBeCloseTo(50, 0);
  });

  it('uses daily report progress when no tasks exist', async () => {
    await testPool.query(
      `INSERT INTO daily_reports (project_id, report_date, progress_percentage, created_by)
       VALUES ($1,'2020-06-01',75.0,$2)`,
      [projectId, managerId]
    );

    const result = await recalculateSPI(projectId);
    expect(result).not.toBeNull();
    expect(result?.actual_progress).toBeCloseTo(75, 0);
  });

  it('creates project_health record on first calculation', async () => {
    const result = await recalculateSPI(projectId);
    expect(result).not.toBeNull();
    const row = await testPool.query(
      'SELECT * FROM project_health WHERE project_id = $1', [projectId]
    );
    expect(row.rows.length).toBe(1);
    expect(row.rows[0].spi_value).toBeDefined();
  });

  it('upserts project_health on recalculation', async () => {
    await recalculateSPI(projectId);
    await recalculateSPI(projectId);
    const row = await testPool.query(
      'SELECT COUNT(*)::int AS cnt FROM project_health WHERE project_id = $1', [projectId]
    );
    // Should only have 1 record (upserted)
    expect(row.rows[0].cnt).toBe(1);
  });

  it('correctly assigns status based on SPI', async () => {
    // 10 tasks all done => actual = 100%
    // Project is in 2020 => planned = 100%
    // SPI = 100/100 = 1.0 => green
    for (let i = 0; i < 10; i++) {
      await testPool.query(
        `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,$2,'done','2020-06-30',$3,FALSE,$4)`,
        [projectId, `Task ${i + 1}`, i, managerId]
      );
    }

    const result = await recalculateSPI(projectId);
    expect(result?.status).toBe('green');
    expect(Number(result?.spi_value)).toBeGreaterThanOrEqual(0.95);
  });

  it('returns red status for SPI < 0.85', async () => {
    // 10 tasks, 0 done => actual = 0%
    // Project is in 2020 => planned = 100%
    // SPI = 0/100 = 0 => red
    for (let i = 0; i < 10; i++) {
      await testPool.query(
        `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,$2,'to_do','2020-06-30',$3,FALSE,$4)`,
        [projectId, `Task ${i + 1}`, i, managerId]
      );
    }

    const result = await recalculateSPI(projectId);
    expect(result?.status).toBe('red');
  });

  // PROYEK SELESAI: SPI = durasi_rencana / durasi_aktual (efisiensi jadwal akhir),
  // BUKAN EV/PV-di-hari-ini yang selalu jatuh ke 1.0. Regresi "SPI 1 semua di riwayat".
  describe('completed projects use schedule efficiency (planned/actual duration)', () => {
    async function seedCompleted(startDaysAgo: number, plannedEndDaysAgo: number, actualEndDaysAgo: number) {
      const start = new Date(Date.now() - startDaysAgo * 86400000).toISOString().slice(0, 10);
      const end = new Date(Date.now() - plannedEndDaysAgo * 86400000).toISOString().slice(0, 10);
      const doneAt = new Date(Date.now() - actualEndDaysAgo * 86400000).toISOString();
      await testPool.query(
        "UPDATE tb_proyek SET start_date=$1, end_date=$2, status='completed' WHERE id_proyek=$3",
        [start, end, projectId]
      );
      for (let i = 0; i < 4; i++) {
        await testPool.query(
          `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, status_changed_at, created_by)
           VALUES ($1,$2,'done',$3,$4,FALSE,$5,$6)`,
          [projectId, `Task ${i + 1}`, end, i, doneAt, managerId]
        );
      }
    }

    it('SPI > 1 (green) when finished EARLIER than planned', async () => {
      // rencana 60 hari, aktual 50 hari -> SPI = 60/50 = 1.2
      await seedCompleted(100, 40, 50);
      const result = await recalculateSPI(projectId);
      expect(Number(result?.spi_value)).toBeGreaterThan(1);
      expect(result?.status).toBe('green');
    });

    it('SPI < 0.85 (red) when finished LATER than planned', async () => {
      // rencana 60 hari, aktual 80 hari -> SPI = 60/80 = 0.75
      await seedCompleted(100, 40, 20);
      const result = await recalculateSPI(projectId);
      expect(Number(result?.spi_value)).toBeLessThan(0.85);
      expect(result?.status).toBe('red');
    });

    it('does NOT collapse every completed project to SPI 1.0', async () => {
      // Inti keluhan "SPI 1 semua": proyek selesai lebih cepat HARUS != 1.
      await seedCompleted(100, 40, 50);
      const result = await recalculateSPI(projectId);
      expect(Number(result?.spi_value)).not.toBe(1);
    });
  });
});
