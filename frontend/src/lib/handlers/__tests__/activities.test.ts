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
import * as activitiesHandler from '../activities';

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

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE task_activities, task_evidence, tasks, project_assignments, projects, clients, users, audit_log
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
    [projectId, 'Test Task', technicianId, 'in_progress', due, 0, false, managerId]
  );
  taskId = task.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Activities Handler', () => {
  describe('createActivity', () => {
    it('creates an activity for assigned technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      formData.append('task_id', String(taskId));
      formData.append('message', 'Working on the task');
      formData.append('activity_type', 'note');
      const req = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await activitiesHandler.createActivity(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.message).toBe('Working on the task');
    });

    it('returns 400 when task_id is missing', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      formData.append('message', 'msg');
      const req = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await activitiesHandler.createActivity(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when message is empty', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      formData.append('task_id', String(taskId));
      formData.append('message', '');
      const req = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await activitiesHandler.createActivity(req);
      expect(res.status).toBe(400);
    });

    it('returns 403 for technician not assigned to task', async () => {
      const hash = await bcrypt.hash('pw', 10);
      const otherTech = await testPool.query(
        `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
        ['Other', 'other@t.com', 'technician', hash]
      );
      const token = makeToken(otherTech.rows[0].id, 'technician', 'other@t.com');
      const formData = new FormData();
      formData.append('task_id', String(taskId));
      formData.append('message', 'Unauthorized');
      const req = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await activitiesHandler.createActivity(req);
      expect(res.status).toBe(403);
    });

    it('returns 404 when task not found', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const formData = new FormData();
      formData.append('task_id', '99999');
      formData.append('message', 'msg');
      const req = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const res = await activitiesHandler.createActivity(req);
      expect(res.status).toBe(404);
    });
  });

  describe('getActivitiesByTask', () => {
    it('returns activities for assigned technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', `/api/tasks/${taskId}/activities`, undefined, token);
      const res = await activitiesHandler.getActivitiesByTask(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 403 for unassigned technician', async () => {
      const hash = await bcrypt.hash('pw', 10);
      const otherTech = await testPool.query(
        `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
        ['Other2', 'other2@t.com', 'technician', hash]
      );
      const token = makeToken(otherTech.rows[0].id, 'technician', 'other2@t.com');
      const req = makeRequest('GET', `/api/tasks/${taskId}/activities`, undefined, token);
      const res = await activitiesHandler.getActivitiesByTask(req, String(taskId));
      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid task ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/tasks/abc/activities', undefined, token);
      const res = await activitiesHandler.getActivitiesByTask(req, 'abc');
      expect(res.status).toBe(400);
    });
  });

  describe('getMyTodayActivities', () => {
    it('returns today activities for authenticated user', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', '/api/activities/today', undefined, token);
      const res = await activitiesHandler.getMyTodayActivities(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', '/api/activities/today');
      const res = await activitiesHandler.getMyTodayActivities(req);
      expect(res.status).toBe(401);
    });
  });

  describe('startTimer / stopTimer', () => {
    it('starts timer for assigned technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', `/api/tasks/${taskId}/timer/start`, undefined, token);
      const res = await activitiesHandler.startTimer(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.is_tracking).toBe(true);
    });

    it('returns 409 when timer already running', async () => {
      // Start timer first
      await testPool.query(
        `UPDATE tasks SET is_tracking=TRUE, timer_started_at=NOW() WHERE id=$1`, [taskId]
      );
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', `/api/tasks/${taskId}/timer/start`, undefined, token);
      const res = await activitiesHandler.startTimer(req, String(taskId));
      expect(res.status).toBe(409);
    });

    it('stops timer for assigned technician', async () => {
      // Start timer first
      await testPool.query(
        `UPDATE tasks SET is_tracking=TRUE, timer_started_at=NOW() WHERE id=$1`, [taskId]
      );
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', `/api/tasks/${taskId}/timer/stop`, undefined, token);
      const res = await activitiesHandler.stopTimer(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.is_tracking).toBe(false);
    });

    it('returns 409 when stopping timer that is not running', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', `/api/tasks/${taskId}/timer/stop`, undefined, token);
      const res = await activitiesHandler.stopTimer(req, String(taskId));
      expect(res.status).toBe(409);
    });

    it('returns 400 when starting timer on done task', async () => {
      await testPool.query(`UPDATE tasks SET status='done' WHERE id=$1`, [taskId]);
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', `/api/tasks/${taskId}/timer/start`, undefined, token);
      const res = await activitiesHandler.startTimer(req, String(taskId));
      expect(res.status).toBe(400);
    });

    it('returns 403 for unassigned technician trying to start timer', async () => {
      const hash = await bcrypt.hash('pw', 10);
      const otherTech = await testPool.query(
        `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
        ['OtherTimer', 'othertimer@t.com', 'technician', hash]
      );
      const token = makeToken(otherTech.rows[0].id, 'technician', 'othertimer@t.com');
      const req = makeRequest('POST', `/api/tasks/${taskId}/timer/start`, undefined, token);
      const res = await activitiesHandler.startTimer(req, String(taskId));
      expect(res.status).toBe(403);
    });
  });
});
