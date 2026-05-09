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
import * as budgetHandler from '../budget';

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
let budgetItemId: number;

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE budget_items, tasks, project_assignments, projects, clients, users, audit_log
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
    ['Project', managerId]
  );
  projectId = proj.rows[0].id;

  const item = await testPool.query(
    `INSERT INTO budget_items (project_id, category, description, amount, is_actual)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [projectId, 'material', 'Test material', 500000, false]
  );
  budgetItemId = item.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Budget Handler', () => {
  describe('createBudgetItem', () => {
    it('creates budget item for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/budget', {
        project_id: projectId,
        category: 'labor',
        description: 'Labor cost',
        amount: 1000000,
        is_actual: false,
      }, token);
      const res = await budgetHandler.createBudgetItem(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.category).toBe('labor');
    });

    it('returns 400 when project_id is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/budget', { category: 'labor', amount: 100 }, token);
      const res = await budgetHandler.createBudgetItem(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when category is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/budget', { project_id: projectId, amount: 100 }, token);
      const res = await budgetHandler.createBudgetItem(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when amount is negative', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/budget', {
        project_id: projectId,
        category: 'labor',
        amount: -100,
      }, token);
      const res = await budgetHandler.createBudgetItem(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 when project not found', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/budget', {
        project_id: 99999,
        category: 'labor',
        amount: 100,
      }, token);
      const res = await budgetHandler.createBudgetItem(req);
      expect(res.status).toBe(404);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', '/api/budget', {
        project_id: projectId, category: 'x', amount: 100,
      }, token);
      const res = await budgetHandler.createBudgetItem(req);
      expect(res.status).toBe(403);
    });
  });

  describe('getBudgetByProject', () => {
    it('returns budget items and summary for any authenticated user', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', `/api/projects/${projectId}/budget`, undefined, token);
      const res = await budgetHandler.getBudgetByProject(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.summary).toHaveProperty('planned_total');
      expect(body.data.summary).toHaveProperty('actual_total');
      expect(body.data.summary).toHaveProperty('variance');
    });

    it('returns 400 for invalid project ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/projects/abc/budget', undefined, token);
      const res = await budgetHandler.getBudgetByProject(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/projects/${projectId}/budget`);
      const res = await budgetHandler.getBudgetByProject(req, String(projectId));
      expect(res.status).toBe(401);
    });
  });

  describe('updateBudgetItem', () => {
    it('updates budget item for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', `/api/budget/${budgetItemId}`, {
        category: 'equipment',
        amount: 750000,
      }, token);
      const res = await budgetHandler.updateBudgetItem(req, String(budgetItemId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.category).toBe('equipment');
    });

    it('returns 404 for non-existent budget item', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', '/api/budget/99999', { category: 'x', amount: 100 }, token);
      const res = await budgetHandler.updateBudgetItem(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', '/api/budget/abc', { category: 'x' }, token);
      const res = await budgetHandler.updateBudgetItem(req, 'abc');
      expect(res.status).toBe(400);
    });
  });

  describe('deleteBudgetItem', () => {
    it('deletes budget item for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/budget/${budgetItemId}`, undefined, token);
      const res = await budgetHandler.deleteBudgetItem(req, String(budgetItemId));
      expect(res.status).toBe(200);
    });

    it('returns 404 for non-existent item', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', '/api/budget/99999', undefined, token);
      const res = await budgetHandler.deleteBudgetItem(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('DELETE', `/api/budget/${budgetItemId}`, undefined, token);
      const res = await budgetHandler.deleteBudgetItem(req, String(budgetItemId));
      expect(res.status).toBe(403);
    });
  });
});
