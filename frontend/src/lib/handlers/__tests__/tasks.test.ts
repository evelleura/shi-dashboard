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
import * as tasksHandler from '../tasks';

const testPool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'shi_test',
  user: 'postgres',
  password: '12345',
});

const JWT_SECRET = 'SecretDian';

function makeToken(userId: number, role: string, email: string) {
  return jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '1h' });
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
let taskId: number;
let adminId: number;

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE task_evidence, task_activities, audit_log, daily_reports, project_health,
      tasks, project_assignments, projects, clients, users
    RESTART IDENTITY CASCADE
  `);

  const hash = await bcrypt.hash('Password123!', 10);

  const mgr = await testPool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Test Manager', 'mgr@test.com', 'manager', hash]
  );
  managerId = mgr.rows[0].id;

  const tech = await testPool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Test Tech', 'tech@test.com', 'technician', hash]
  );
  technicianId = tech.rows[0].id;

  const adm = await testPool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Test Admin', 'admin@test.com', 'admin', hash]
  );
  adminId = adm.rows[0].id;

  const start = new Date();
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const proj = await testPool.query(
    `INSERT INTO projects (name, description, client_id, start_date, end_date, status, phase, category, project_value, survey_approved, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    ['Test Project', 'desc', null, start.toISOString().split('T')[0], end.toISOString().split('T')[0],
     'active', 'execution', 'instalasi', 5000000, true, managerId]
  );
  projectId = proj.rows[0].id;

  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const task = await testPool.query(
    `INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [projectId, 'Test Task', 'desc', technicianId, 'to_do', due.toISOString().split('T')[0], 0, false, managerId]
  );
  taskId = task.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Tasks Handler', () => {
  describe('createTask', () => {
    it('returns 201 with created task for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks', {
        project_id: projectId,
        name: 'New Task',
        description: 'Task desc',
      }, token);
      const res = await tasksHandler.createTask(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('New Task');
    });

    it('returns 403 for technician trying to create task', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('POST', '/api/tasks', {
        project_id: projectId,
        name: 'New Task',
      }, token);
      const res = await tasksHandler.createTask(req);
      expect(res.status).toBe(403);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('POST', '/api/tasks', { project_id: projectId, name: 'Task' });
      const res = await tasksHandler.createTask(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when name is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks', { project_id: projectId }, token);
      const res = await tasksHandler.createTask(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when name is empty string', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks', { project_id: projectId, name: '   ' }, token);
      const res = await tasksHandler.createTask(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 when project does not exist', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks', { project_id: 99999, name: 'Task' }, token);
      const res = await tasksHandler.createTask(req);
      expect(res.status).toBe(404);
    });

    it('returns 400 when assigned_to user does not exist', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks', {
        project_id: projectId,
        name: 'Task',
        assigned_to: 99999,
      }, token);
      const res = await tasksHandler.createTask(req);
      expect(res.status).toBe(400);
    });

    it('auto-assigns sort_order when not provided', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks', {
        project_id: projectId,
        name: 'Auto Order Task',
      }, token);
      const res = await tasksHandler.createTask(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(typeof body.data.sort_order).toBe('number');
    });
  });

  describe('getTask', () => {
    it('returns task for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('GET', `/api/tasks/${taskId}`, undefined, token);
      const res = await tasksHandler.getTask(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.id).toBe(taskId);
    });

    it('returns task for assigned technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('GET', `/api/tasks/${taskId}`, undefined, token);
      const res = await tasksHandler.getTask(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.id).toBe(taskId);
    });

    it('returns 403 for unassigned technician', async () => {
      const hash = await bcrypt.hash('pw', 10);
      const otherTech = await testPool.query(
        `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
        ['Other Tech', 'other@test.com', 'technician', hash]
      );
      const token = makeToken(otherTech.rows[0].id, 'technician', 'other@test.com');
      const req = makeRequest('GET', `/api/tasks/${taskId}`, undefined, token);
      const res = await tasksHandler.getTask(req, String(taskId));
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent task', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('GET', '/api/tasks/99999', undefined, token);
      const res = await tasksHandler.getTask(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid task ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('GET', '/api/tasks/abc', undefined, token);
      const res = await tasksHandler.getTask(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/tasks/${taskId}`);
      const res = await tasksHandler.getTask(req, String(taskId));
      expect(res.status).toBe(401);
    });
  });

  describe('updateTask', () => {
    it('updates task name for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PUT', `/api/tasks/${taskId}`, { name: 'Updated Task' }, token);
      const res = await tasksHandler.updateTask(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.name).toBe('Updated Task');
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('PUT', `/api/tasks/${taskId}`, { name: 'Hacked' }, token);
      const res = await tasksHandler.updateTask(req, String(taskId));
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent task', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PUT', '/api/tasks/99999', { name: 'X' }, token);
      const res = await tasksHandler.updateTask(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid task ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PUT', '/api/tasks/abc', { name: 'X' }, token);
      const res = await tasksHandler.updateTask(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PUT', `/api/tasks/${taskId}`, { status: 'invalid_status' }, token);
      const res = await tasksHandler.updateTask(req, String(taskId));
      expect(res.status).toBe(400);
    });
  });

  describe('deleteTask', () => {
    it('deletes task for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('DELETE', `/api/tasks/${taskId}`, undefined, token);
      const res = await tasksHandler.deleteTask(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('DELETE', `/api/tasks/${taskId}`, undefined, token);
      const res = await tasksHandler.deleteTask(req, String(taskId));
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent task', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('DELETE', '/api/tasks/99999', undefined, token);
      const res = await tasksHandler.deleteTask(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid task ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('DELETE', '/api/tasks/abc', undefined, token);
      const res = await tasksHandler.deleteTask(req, 'abc');
      expect(res.status).toBe(400);
    });
  });

  describe('changeTaskStatus', () => {
    it('technician can change own task from to_do to in_progress', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'in_progress' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.status).toBe('in_progress');
    });

    it('manager can change task to any valid status', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'done' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(200);
    });

    it('technician cannot change status of task not assigned to them', async () => {
      const hash = await bcrypt.hash('pw', 10);
      const otherTech = await testPool.query(
        `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
        ['Other Tech2', 'other2@test.com', 'technician', hash]
      );
      const token = makeToken(otherTech.rows[0].id, 'technician', 'other2@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'in_progress' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(403);
    });

    it('technician cannot make invalid transition from to_do to done', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'done' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(400);
    });

    it('accumulates time_spent_seconds when leaving an active status', async () => {
      // Move into in_progress, simulate time passing, then move to review
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      let req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'in_progress' }, token);
      await tasksHandler.changeTaskStatus(req, String(taskId));

      // Backdate status_changed_at so the elapsed-second math has something to add
      await testPool.query(
        `UPDATE tasks SET status_changed_at = NOW() - INTERVAL '120 seconds' WHERE id=$1`,
        [taskId]
      );

      req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'review' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.status).toBe('review');
      // Should have accrued ~120 seconds
      expect(Number(body.data.time_spent_seconds)).toBeGreaterThanOrEqual(110);
    });

    it('writes a task_activities row on every status change', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'in_progress' }, token);
      await tasksHandler.changeTaskStatus(req, String(taskId));
      const acts = await testPool.query(
        `SELECT activity_type, message FROM task_activities WHERE task_id=$1 ORDER BY id`,
        [taskId]
      );
      expect(acts.rowCount).toBe(1);
      expect(acts.rows[0].activity_type).toBe('start_work');
    });

    it('is a no-op when target status equals current status', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'to_do' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(200);
      const acts = await testPool.query(`SELECT id FROM task_activities WHERE task_id=$1`, [taskId]);
      expect(acts.rowCount).toBe(0);
    });

    it('returns 400 for invalid status value', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'invalid' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(400);
    });

    it('returns 400 when status is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, {}, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent task', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', '/api/tasks/99999/status', { status: 'in_progress' }, token);
      const res = await tasksHandler.changeTaskStatus(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid task ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', '/api/tasks/abc/status', { status: 'in_progress' }, token);
      const res = await tasksHandler.changeTaskStatus(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('blocks status change if dependent task is not done', async () => {
      const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      // Create a dependency task
      const depTask = await testPool.query(
        `INSERT INTO tasks (project_id, name, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [projectId, 'Dep Task', 'to_do', due.toISOString().split('T')[0], 1, false, managerId]
      );
      const depTaskId = depTask.rows[0].id;

      // Make our task depend on the dep task
      await testPool.query(`UPDATE tasks SET depends_on=$1 WHERE id=$2`, [depTaskId, taskId]);

      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'in_progress' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(400);
    });

    it('blocks non-survey task when project is in survey phase', async () => {
      await testPool.query(`UPDATE projects SET phase='survey' WHERE id=$1`, [projectId]);
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/status`, { status: 'in_progress' }, token);
      const res = await tasksHandler.changeTaskStatus(req, String(taskId));
      expect(res.status).toBe(400);
    });
  });

  describe('getTasksByProject', () => {
    it('returns all tasks for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('GET', `/api/projects/${projectId}/tasks`, undefined, token);
      const res = await tasksHandler.getTasksByProject(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns only own tasks for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('GET', `/api/projects/${projectId}/tasks`, undefined, token);
      const res = await tasksHandler.getTasksByProject(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      // All returned tasks should be assigned to the technician
      for (const t of body.data) {
        expect(t.assigned_to).toBe(technicianId);
      }
    });

    it('returns 400 for invalid project ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('GET', '/api/projects/abc/tasks', undefined, token);
      const res = await tasksHandler.getTasksByProject(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/projects/${projectId}/tasks`);
      const res = await tasksHandler.getTasksByProject(req, String(projectId));
      expect(res.status).toBe(401);
    });
  });

  describe('reorderTask', () => {
    it('updates sort_order for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/reorder`, { sort_order: 5 }, token);
      const res = await tasksHandler.reorderTask(req, String(taskId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.sort_order).toBe(5);
    });

    it('returns 400 for negative sort_order', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/reorder`, { sort_order: -1 }, token);
      const res = await tasksHandler.reorderTask(req, String(taskId));
      expect(res.status).toBe(400);
    });

    it('returns 400 when sort_order is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/reorder`, {}, token);
      const res = await tasksHandler.reorderTask(req, String(taskId));
      expect(res.status).toBe(400);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('PATCH', `/api/tasks/${taskId}/reorder`, { sort_order: 2 }, token);
      const res = await tasksHandler.reorderTask(req, String(taskId));
      expect(res.status).toBe(403);
    });
  });

  describe('bulkCreateTasks', () => {
    it('creates multiple tasks for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks/bulk', {
        project_id: projectId,
        tasks: [
          { name: 'Bulk Task 1' },
          { name: 'Bulk Task 2' },
        ],
      }, token);
      const res = await tasksHandler.bulkCreateTasks(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.length).toBe(2);
    });

    it('returns 400 for empty tasks array', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks/bulk', { project_id: projectId, tasks: [] }, token);
      const res = await tasksHandler.bulkCreateTasks(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for task without name', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks/bulk', {
        project_id: projectId,
        tasks: [{ name: '' }],
      }, token);
      const res = await tasksHandler.bulkCreateTasks(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 when project not found', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('POST', '/api/tasks/bulk', {
        project_id: 99999,
        tasks: [{ name: 'Task' }],
      }, token);
      const res = await tasksHandler.bulkCreateTasks(req);
      expect(res.status).toBe(404);
    });
  });

  describe('getScheduleTasks', () => {
    it('returns schedule tasks for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = makeRequest('GET', '/api/tasks/schedule', undefined, token);
      const res = await tasksHandler.getScheduleTasks(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@test.com');
      const req = makeRequest('GET', '/api/tasks/schedule', undefined, token);
      const res = await tasksHandler.getScheduleTasks(req);
      expect(res.status).toBe(403);
    });
  });

  describe('checkConflicts', () => {
    it('returns empty conflicts for non-overlapping dates', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const start = '2030-01-01';
      const end = '2030-01-07';
      const req = new NextRequest(
        `http://localhost:3000/api/tasks/conflicts?technician_id=${technicianId}&start=${start}&end=${end}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const res = await tasksHandler.checkConflicts(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 400 when technician_id is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@test.com');
      const req = new NextRequest(
        `http://localhost:3000/api/tasks/conflicts?start=2030-01-01&end=2030-01-07`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const res = await tasksHandler.checkConflicts(req);
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/tasks/conflicts?technician_id=1&start=2030-01-01&end=2030-01-07`
      );
      const res = await tasksHandler.checkConflicts(req);
      expect(res.status).toBe(401);
    });
  });
});
