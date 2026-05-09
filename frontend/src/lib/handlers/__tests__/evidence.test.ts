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
import * as evidenceHandler from '../evidence';

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
let taskId: number;
let evidenceId: number;

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE task_evidence, tasks, project_assignments, projects, clients, users, audit_log
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
  const projectId = proj.rows[0].id;

  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const task = await testPool.query(
    `INSERT INTO tasks (project_id, name, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [projectId, 'Test Task', technicianId, 'to_do', due, 0, false, managerId]
  );
  taskId = task.rows[0].id;

  // Seed a fake evidence record (no actual file on disk for most tests)
  const ev = await testPool.query(
    `INSERT INTO task_evidence (task_id, file_path, file_name, file_type, file_size, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [taskId, 'uploads/projects/1/tasks/1/test_file.txt', 'test_file.txt', 'photo', 100, technicianId]
  );
  evidenceId = ev.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Evidence Handler', () => {
  describe('getEvidenceByTask', () => {
    it('returns evidence list for task', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', `/api/tasks/${taskId}/evidence`, undefined, token);
      const res = await evidenceHandler.getEvidenceByTask(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns 400 for invalid task ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/tasks/abc/evidence', undefined, token);
      const res = await evidenceHandler.getEvidenceByTask(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/tasks/${taskId}/evidence`);
      const res = await evidenceHandler.getEvidenceByTask(req, String(taskId));
      expect(res.status).toBe(401);
    });
  });

  describe('deleteEvidence', () => {
    it('deletes evidence for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/evidence/${evidenceId}`, undefined, token);
      const res = await evidenceHandler.deleteEvidence(req, String(evidenceId));
      expect(res.status).toBe(200);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('DELETE', `/api/evidence/${evidenceId}`, undefined, token);
      const res = await evidenceHandler.deleteEvidence(req, String(evidenceId));
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent evidence', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', '/api/evidence/99999', undefined, token);
      const res = await evidenceHandler.deleteEvidence(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid evidence ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', '/api/evidence/abc', undefined, token);
      const res = await evidenceHandler.deleteEvidence(req, 'abc');
      expect(res.status).toBe(400);
    });
  });

  describe('downloadEvidence', () => {
    it('returns 404 when file not found on disk', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', `/api/evidence/${evidenceId}/download`, undefined, token);
      const res = await evidenceHandler.downloadEvidence(req, String(evidenceId));
      // File doesn't exist on disk, so should return 404
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-existent evidence record', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/evidence/99999/download', undefined, token);
      const res = await evidenceHandler.downloadEvidence(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/evidence/${evidenceId}/download`);
      const res = await evidenceHandler.downloadEvidence(req, String(evidenceId));
      expect(res.status).toBe(401);
    });
  });

  describe('uploadEvidence', () => {
    it('returns 400 when task_id is missing', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      // no task_id
      const req = new NextRequest('http://localhost:3000/api/evidence', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await evidenceHandler.uploadEvidence(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when no file is provided', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      formData.append('task_id', String(taskId));
      const req = new NextRequest('http://localhost:3000/api/evidence', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await evidenceHandler.uploadEvidence(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 when task not found', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      formData.append('task_id', '99999');
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      formData.append('file', blob, 'test.jpg');
      const req = new NextRequest('http://localhost:3000/api/evidence', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await evidenceHandler.uploadEvidence(req);
      expect(res.status).toBe(404);
    });

    it('returns 400 for disallowed MIME type', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      formData.append('task_id', String(taskId));
      const blob = new Blob(['test'], { type: 'text/plain' });
      formData.append('file', blob, 'test.txt');
      const req = new NextRequest('http://localhost:3000/api/evidence', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await evidenceHandler.uploadEvidence(req);
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const formData = new FormData();
      formData.append('task_id', String(taskId));
      const req = new NextRequest('http://localhost:3000/api/evidence', {
        method: 'POST',
        body: formData,
      });
      const res = await evidenceHandler.uploadEvidence(req);
      expect(res.status).toBe(401);
    });
  });
});
