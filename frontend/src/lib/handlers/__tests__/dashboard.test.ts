process.env.DB_NAME = 'shi_test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = '12345';
process.env.JWT_SECRET = 'SecretDian';


import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as dashHandler from '../dashboard';

const testPool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'shi_test',
  user: 'postgres',
  password: '12345',
});

function makeToken(userId: number, role: string, email: string) {
  return jwt.sign({ userId, role, email }, 'SecretDian', { expiresIn: '1h' });
}

function makeRequest(method: string, url: string, body?: object, token?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

let managerId: number;
let technicianId: number;
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

  const tech = await testPool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Tech', 'tech@t.com', 'technician', hash]
  );
  technicianId = tech.rows[0].id;

  const proj = await testPool.query(
    `INSERT INTO projects (name, start_date, end_date, status, phase, category, project_value, survey_approved, created_by)
     VALUES ($1,'2030-01-01','2030-12-31','active','execution','instalasi',5000000,TRUE,$2) RETURNING id`,
    ['Active Project', managerId]
  );
  projectId = proj.rows[0].id;

  await testPool.query(
    `INSERT INTO project_assignments (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [projectId, technicianId]
  );
});

afterAll(async () => {
  await testPool.end();
});

describe('Dashboard Handler', () => {
  describe('getDashboard', () => {
    it('returns dashboard data for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard', undefined, token);
      const res = await dashHandler.getDashboard(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.projects)).toBe(true);
      expect(typeof body.data.summary).toBe('object');
      expect(Array.isArray(body.data.recent_activity)).toBe(true);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', '/api/dashboard', undefined, token);
      const res = await dashHandler.getDashboard(req);
      expect(res.status).toBe(403);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', '/api/dashboard');
      const res = await dashHandler.getDashboard(req);
      expect(res.status).toBe(401);
    });

    it('accepts date filter parameters', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = new NextRequest(
        'http://localhost:3000/api/dashboard?start_date=2030-01-01&end_date=2030-12-31',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const res = await dashHandler.getDashboard(req);
      expect(res.status).toBe(200);
    });

    it('summary includes required fields', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard', undefined, token);
      const res = await dashHandler.getDashboard(req);
      const body = await res.json();
      const s = body.data.summary;
      expect(s).toHaveProperty('total_projects');
      expect(s).toHaveProperty('active_projects');
      expect(s).toHaveProperty('total_tasks');
      expect(s).toHaveProperty('completed_tasks');
    });
  });

  describe('getTechnicianDashboard', () => {
    it('returns technician dashboard for any authenticated user', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', '/api/dashboard/technician', undefined, token);
      const res = await dashHandler.getTechnicianDashboard(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data).toHaveProperty('my_tasks');
      expect(body.data).toHaveProperty('assigned_projects');
      expect(body.data).toHaveProperty('recent_tasks');
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', '/api/dashboard/technician');
      const res = await dashHandler.getTechnicianDashboard(req);
      expect(res.status).toBe(401);
    });
  });

  describe('chartOverdueTasks', () => {
    it('returns array for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/overdue', undefined, token);
      const res = await dashHandler.chartOverdueTasks(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/overdue', undefined, token);
      const res = await dashHandler.chartOverdueTasks(req);
      expect(res.status).toBe(403);
    });
  });

  describe('chartTasksByStatus', () => {
    it('returns task status distribution for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/tasks-by-status', undefined, token);
      const res = await dashHandler.chartTasksByStatus(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('chartTasksByOwner', () => {
    it('returns task breakdown by owner', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/tasks-by-owner', undefined, token);
      const res = await dashHandler.chartTasksByOwner(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('chartTasksByDueDate', () => {
    it('returns tasks grouped by due date month', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/tasks-by-duedate', undefined, token);
      const res = await dashHandler.chartTasksByDueDate(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('chartEarnedValue', () => {
    it('returns earned value data for a project', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', `/api/dashboard/charts/earned-value/${projectId}`, undefined, token);
      const res = await dashHandler.chartEarnedValue(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data).toHaveProperty('project_id');
      expect(Array.isArray(body.data.timeline)).toBe(true);
    });

    it('returns 404 for non-existent project', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/earned-value/99999', undefined, token);
      const res = await dashHandler.chartEarnedValue(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid project ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/earned-value/abc', undefined, token);
      const res = await dashHandler.chartEarnedValue(req, 'abc');
      expect(res.status).toBe(400);
    });
  });

  describe('globalSearch', () => {
    it('returns empty array for empty query', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = new NextRequest('http://localhost:3000/api/search?q=', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await dashHandler.globalSearch(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns results for manager search', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = new NextRequest('http://localhost:3000/api/search?q=Active', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await dashHandler.globalSearch(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns technician-scoped results for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = new NextRequest('http://localhost:3000/api/search?q=Test', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await dashHandler.globalSearch(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('chartProjectCategories', () => {
    it('returns project categories for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/categories', undefined, token);
      const res = await dashHandler.chartProjectCategories(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('chartTechnicianWorkload', () => {
    it('returns workload data for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/dashboard/charts/workload', undefined, token);
      const res = await dashHandler.chartTechnicianWorkload(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('technicianProductivity', () => {
    it('returns productivity data', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', '/api/dashboard/productivity', undefined, token);
      const res = await dashHandler.technicianProductivity(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('technicianTimeSpent', () => {
    it('returns time spent data', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', '/api/dashboard/time-spent', undefined, token);
      const res = await dashHandler.technicianTimeSpent(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
