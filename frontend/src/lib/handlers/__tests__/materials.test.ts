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
import * as materialsHandler from '../materials';

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
let materialId: number;

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE materials, tasks, project_assignments, projects, clients, users, audit_log
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

  const mat = await testPool.query(
    `INSERT INTO materials (project_id, name, quantity, unit, unit_price)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [projectId, 'Test Material', 10, 'pcs', 50000]
  );
  materialId = mat.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Materials Handler', () => {
  describe('createMaterial', () => {
    it('creates material for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/materials', {
        project_id: projectId,
        name: 'New Material',
        quantity: 5,
        unit: 'kg',
        unit_price: 25000,
      }, token);
      const res = await materialsHandler.createMaterial(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.name).toBe('New Material');
    });

    it('returns 400 when name is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/materials', { project_id: projectId }, token);
      const res = await materialsHandler.createMaterial(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when name is empty', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/materials', { project_id: projectId, name: '  ' }, token);
      const res = await materialsHandler.createMaterial(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative quantity', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/materials', {
        project_id: projectId, name: 'X', quantity: -5,
      }, token);
      const res = await materialsHandler.createMaterial(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative unit_price', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/materials', {
        project_id: projectId, name: 'X', unit_price: -1000,
      }, token);
      const res = await materialsHandler.createMaterial(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 when project not found', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/materials', {
        project_id: 99999, name: 'X',
      }, token);
      const res = await materialsHandler.createMaterial(req);
      expect(res.status).toBe(404);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', '/api/materials', { project_id: projectId, name: 'X' }, token);
      const res = await materialsHandler.createMaterial(req);
      expect(res.status).toBe(403);
    });
  });

  describe('getMaterialsByProject', () => {
    it('returns materials list for any authenticated user', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', `/api/projects/${projectId}/materials`, undefined, token);
      const res = await materialsHandler.getMaterialsByProject(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data.materials)).toBe(true);
      expect(body.data).toHaveProperty('total_items');
      expect(body.data).toHaveProperty('total_cost');
    });

    it('returns 400 for invalid project ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/projects/abc/materials', undefined, token);
      const res = await materialsHandler.getMaterialsByProject(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/projects/${projectId}/materials`);
      const res = await materialsHandler.getMaterialsByProject(req, String(projectId));
      expect(res.status).toBe(401);
    });
  });

  describe('updateMaterial', () => {
    it('updates material for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', `/api/materials/${materialId}`, {
        name: 'Updated Material',
        quantity: 20,
      }, token);
      const res = await materialsHandler.updateMaterial(req, String(materialId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.name).toBe('Updated Material');
    });

    it('returns 400 if name set to empty', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', `/api/materials/${materialId}`, { name: '' }, token);
      const res = await materialsHandler.updateMaterial(req, String(materialId));
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent material', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', '/api/materials/99999', { name: 'X' }, token);
      const res = await materialsHandler.updateMaterial(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid material ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', '/api/materials/abc', { name: 'X' }, token);
      const res = await materialsHandler.updateMaterial(req, 'abc');
      expect(res.status).toBe(400);
    });
  });

  describe('deleteMaterial', () => {
    it('deletes material for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/materials/${materialId}`, undefined, token);
      const res = await materialsHandler.deleteMaterial(req, String(materialId));
      expect(res.status).toBe(200);
    });

    it('returns 404 for non-existent material', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', '/api/materials/99999', undefined, token);
      const res = await materialsHandler.deleteMaterial(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('DELETE', `/api/materials/${materialId}`, undefined, token);
      const res = await materialsHandler.deleteMaterial(req, String(materialId));
      expect(res.status).toBe(403);
    });
  });
});
