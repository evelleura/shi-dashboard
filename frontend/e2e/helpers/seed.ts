import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shi_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
});

export async function resetDatabase() {
  await pool.query(`
    TRUNCATE TABLE
      task_evidence, materials, budget_items,
      task_activities, audit_log,
      daily_reports, project_health,
      tasks, project_assignments,
      projects, clients,
      users
    RESTART IDENTITY CASCADE
  `);
}

export async function seedUser(
  role: 'technician' | 'manager' | 'admin',
  overrides: Record<string, unknown> = {}
) {
  const hash = await bcrypt.hash('Password123!', 10);
  const defaults = {
    name: `Test ${role}`,
    email: `${role}@test.shi`,
    role,
    password_hash: hash,
    is_active: true,
  };
  const merged = { ...defaults, ...overrides };
  const res = await pool.query(
    `INSERT INTO users (name, email, role, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [merged.name, merged.email, merged.role, merged.password_hash, merged.is_active]
  );
  return res.rows[0];
}

export async function seedClient(overrides: Record<string, unknown> = {}) {
  const defaults = {
    name: 'PT Test Client',
    address: 'Jl. Test 1',
    phone: '081234567890',
    email: 'client@test.shi',
  };
  const merged = { ...defaults, ...overrides };
  const res = await pool.query(
    `INSERT INTO clients (name, address, phone, email, created_by)
     SELECT $1, $2, $3, $4, id FROM users WHERE role='manager' LIMIT 1 RETURNING *`,
    [merged.name, merged.address, merged.phone, merged.email]
  );
  return res.rows[0];
}

export async function seedProject(opts: {
  clientId: number;
  managerId: number;
  phase?: string;
  status?: string;
  value?: number;
}) {
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const res = await pool.query(
    `INSERT INTO projects (name, description, client_id, start_date, end_date, status, phase, category, project_value, survey_approved, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      'Test Project',
      'Test description',
      opts.clientId,
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
      opts.status || 'active',
      opts.phase || 'execution',
      'instalasi',
      opts.value || 5000000,
      opts.phase !== 'survey',
      opts.managerId,
    ]
  );
  return res.rows[0];
}

export async function seedTask(opts: {
  projectId: number;
  assignedTo?: number;
  status?: string;
  managerId: number;
  isSurveyTask?: boolean;
}) {
  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const res = await pool.query(
    `INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      opts.projectId,
      'Test Task',
      'Task description',
      opts.assignedTo || null,
      opts.status || 'to_do',
      due.toISOString().split('T')[0],
      100000,
      0,
      opts.isSurveyTask || false,
      opts.managerId,
    ]
  );
  return res.rows[0];
}

export async function seedProjectAssignment(projectId: number, userId: number) {
  await pool.query(
    `INSERT INTO project_assignments (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [projectId, userId]
  );
}

export { pool };
