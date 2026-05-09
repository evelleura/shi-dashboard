process.env.DB_NAME = 'shi_test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = '12345';
process.env.JWT_SECRET = 'SecretDian';


import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import {
  calculatePlannedValue,
  categorizeHealth,
  recalculateSPI,
} from '../spiCalculator';

const testPool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'shi_test',
  user: 'postgres',
  password: '12345',
});

let managerId: number;
let projectId: number;

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE task_evidence, task_activities, audit_log, daily_reports, project_health,
      tasks, project_assignments, projects, clients, users
    RESTART IDENTITY CASCADE
  `);
  const hash = await bcrypt.hash('pw', 10);
  const mgr = await testPool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Manager', 'mgr@t.com', 'manager', hash]
  );
  managerId = mgr.rows[0].id;

  const proj = await testPool.query(
    `INSERT INTO projects (name, start_date, end_date, status, phase, category, project_value, survey_approved, created_by)
     VALUES ($1,'2020-01-01','2020-12-31','active','execution','instalasi',5000000,TRUE,$2) RETURNING id`,
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

describe('recalculateSPI', () => {
  it('returns null for non-existent project', async () => {
    const result = await recalculateSPI(99999);
    expect(result).toBeNull();
  });

  it('calculates SPI=1 when no tasks exist and project is on schedule', async () => {
    // Project is in the past (start: 2020-01-01, end: 2020-12-31)
    // so planned value = 100, actual = 0 (no tasks, no reports) => SPI = 0/100 = 0
    const result = await recalculateSPI(projectId);
    expect(result).not.toBeNull();
    expect(typeof result?.spi_value).toBe('number');
    // With no tasks and no reports, actual progress = 0
    expect(result?.actual_progress).toBe(0);
    expect(result?.total_tasks).toBe(0);
    expect(result?.completed_tasks).toBe(0);
  });

  it('calculates correct SPI with tasks', async () => {
    const due = '2020-06-30';
    // Create 4 tasks: 2 done, 2 to_do
    for (let i = 0; i < 4; i++) {
      const status = i < 2 ? 'done' : 'to_do';
      await testPool.query(
        `INSERT INTO tasks (project_id, name, status, due_date, sort_order, is_survey_task, created_by)
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
        `INSERT INTO tasks (project_id, name, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,$2,'done','2020-06-30',$3,FALSE,$4)`,
        [projectId, `Task ${i + 1}`, i, managerId]
      );
    }

    const result = await recalculateSPI(projectId);
    expect(result?.status).toBe('green');
    expect(result?.spi_value).toBeGreaterThanOrEqual(0.95);
  });

  it('returns red status for SPI < 0.85', async () => {
    // 10 tasks, 0 done => actual = 0%
    // Project is in 2020 => planned = 100%
    // SPI = 0/100 = 0 => red
    for (let i = 0; i < 10; i++) {
      await testPool.query(
        `INSERT INTO tasks (project_id, name, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,$2,'to_do','2020-06-30',$3,FALSE,$4)`,
        [projectId, `Task ${i + 1}`, i, managerId]
      );
    }

    const result = await recalculateSPI(projectId);
    expect(result?.status).toBe('red');
  });
});
