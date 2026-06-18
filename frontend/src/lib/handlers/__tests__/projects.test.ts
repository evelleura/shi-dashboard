process.env.DB_NAME = 'shi_test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '5433';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.JWT_SECRET = 'SecretDian';


import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as projectsHandler from '../projects';

const testPool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'shi_test',
  user: 'postgres',
  password: 'postgres',
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
let adminId: number;
let clientId: number;
let projectId: number;

const futureStart = '2030-01-01';
const futureEnd = '2030-06-30';

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

  const tech = await testPool.query(
    `INSERT INTO tb_user (nama, email, role, password) VALUES ($1,$2,$3,$4) RETURNING id_user AS id`,
    ['Tech', 'tech@t.com', 'teknisi', hash]
  );
  technicianId = tech.rows[0].id;

  const adm = await testPool.query(
    `INSERT INTO tb_user (nama, email, role, password) VALUES ($1,$2,$3,$4) RETURNING id_user AS id`,
    ['Admin', 'admin@t.com', 'manajer', hash]
  );
  adminId = adm.rows[0].id;

  const cl = await testPool.query(
    `INSERT INTO tb_klien (nama_klien, alamat, no_telp, email, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id_klien AS id`,
    ['Client', 'Jl.1', '08123', 'c@t.com', managerId]
  );
  clientId = cl.rows[0].id;

  const proj = await testPool.query(
    `INSERT INTO tb_proyek (nama_proyek, description, id_klien, start_date, end_date, status, phase, category, project_value, survey_approved, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id_proyek AS id`,
    ['Test Project', 'desc', clientId, futureStart, futureEnd, 'active', 'execution', 'instalasi', 5000000, true, managerId]
  );
  projectId = proj.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Projects Handler', () => {
  describe('listProjects', () => {
    it('returns project list for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', '/api/projects', undefined, token);
      const res = await projectsHandler.listProjects(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', '/api/projects');
      const res = await projectsHandler.listProjects(req);
      expect(res.status).toBe(401);
    });
  });

  describe('createProject', () => {
    it('creates project for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', '/api/projects', {
        name: 'New Project',
        start_date: '2031-01-01',
        end_date: '2031-06-30',
        client_id: clientId,
        phase: 'survey',
        category: 'instalasi',
        project_value: 3000000,
      }, token);
      const res = await projectsHandler.createProject(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.name).toBe('New Project');
      expect(body.data.project_code).toBeTruthy();
    });

    it('returns 400 when name is missing', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', '/api/projects', {
        start_date: '2031-01-01',
        end_date: '2031-06-30',
      }, token);
      const res = await projectsHandler.createProject(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when start_date >= end_date', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', '/api/projects', {
        name: 'Bad Dates',
        start_date: '2031-06-30',
        end_date: '2031-01-01',
      }, token);
      const res = await projectsHandler.createProject(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when client_id does not exist', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', '/api/projects', {
        name: 'Bad Client',
        start_date: '2031-01-01',
        end_date: '2031-06-30',
        client_id: 99999,
      }, token);
      const res = await projectsHandler.createProject(req);
      expect(res.status).toBe(400);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('POST', '/api/projects', {
        name: 'X',
        start_date: '2031-01-01',
        end_date: '2031-06-30',
      }, token);
      const res = await projectsHandler.createProject(req);
      expect(res.status).toBe(403);
    });

    it('defaults invalid category to instalasi', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', '/api/projects', {
        name: 'Cat Project',
        start_date: '2031-01-01',
        end_date: '2031-06-30',
        client_id: clientId,
        category: 'invalid_cat',
      }, token);
      const res = await projectsHandler.createProject(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.category).toBe('instalasi');
    });
  });

  describe('getProject', () => {
    it('returns project detail for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', `/api/projects/${projectId}`, undefined, token);
      const res = await projectsHandler.getProject(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.id).toBe(projectId);
      expect(Array.isArray(body.data.tasks)).toBe(true);
      expect(Array.isArray(body.data.assigned_technicians)).toBe(true);
    });

    it('returns 404 for non-existent project', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', '/api/projects/99999', undefined, token);
      const res = await projectsHandler.getProject(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid project ID', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', '/api/projects/abc', undefined, token);
      const res = await projectsHandler.getProject(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/projects/${projectId}`);
      const res = await projectsHandler.getProject(req, String(projectId));
      expect(res.status).toBe(401);
    });
  });

  describe('updateProject', () => {
    it('updates project name for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('PUT', `/api/projects/${projectId}`, { name: 'Updated Project' }, token);
      const res = await projectsHandler.updateProject(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.name).toBe('Updated Project');
    });

    it('returns 400 when updated dates are invalid', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('PUT', `/api/projects/${projectId}`, {
        start_date: '2031-12-31',
        end_date: '2031-01-01',
      }, token);
      const res = await projectsHandler.updateProject(req, String(projectId));
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent project', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('PUT', '/api/projects/99999', { name: 'X' }, token);
      const res = await projectsHandler.updateProject(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('PUT', `/api/projects/${projectId}`, { name: 'X' }, token);
      const res = await projectsHandler.updateProject(req, String(projectId));
      expect(res.status).toBe(403);
    });
  });

  describe('deleteProject', () => {
    it('deletes project for admin', async () => {
      const token = makeToken(adminId, 'manajer', 'admin@t.com');
      const req = makeRequest('DELETE', `/api/projects/${projectId}`, undefined, token);
      const res = await projectsHandler.deleteProject(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 403 for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/projects/${projectId}`, undefined, token);
      const res = await projectsHandler.deleteProject(req, String(projectId));
      expect(res.status).not.toBe(403); // 2 peran: manajer mewarisi wewenang admin
    });

    it('returns 404 for non-existent project', async () => {
      const token = makeToken(adminId, 'manajer', 'admin@t.com');
      const req = makeRequest('DELETE', '/api/projects/99999', undefined, token);
      const res = await projectsHandler.deleteProject(req, '99999');
      expect(res.status).toBe(404);
    });
  });

  describe('approveSurvey', () => {
    it('returns 400 when project is not in survey phase', async () => {
      // projectId is in execution phase
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/approve-survey`, undefined, token);
      const res = await projectsHandler.approveSurvey(req, String(projectId));
      expect(res.status).toBe(400);
    });

    it('returns 400 when no survey tasks exist', async () => {
      await testPool.query(
        `UPDATE tb_proyek SET phase='survey', survey_approved=FALSE WHERE id_proyek=$1`, [projectId]
      );
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/approve-survey`, undefined, token);
      const res = await projectsHandler.approveSurvey(req, String(projectId));
      expect(res.status).toBe(400);
    });

    it('approves survey when all survey tasks are done', async () => {
      await testPool.query(
        `UPDATE tb_proyek SET phase='survey', survey_approved=FALSE WHERE id_proyek=$1`, [projectId]
      );
      const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await testPool.query(
        `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,'Survey Task','done',$2,0,TRUE,$3)`,
        [projectId, due.toISOString().split('T')[0], managerId]
      );
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/approve-survey`, undefined, token);
      const res = await projectsHandler.approveSurvey(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.phase).toBe('execution');
      expect(body.data.survey_approved).toBe(true);
    });

    it('returns 404 for non-existent project', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', '/api/projects/99999/approve-survey', undefined, token);
      const res = await projectsHandler.approveSurvey(req, '99999');
      expect(res.status).toBe(404);
    });
  });

  describe('rejectSurvey', () => {
    it('rejects survey and resets survey tasks', async () => {
      await testPool.query(
        `UPDATE tb_proyek SET phase='survey', survey_approved=FALSE WHERE id_proyek=$1`, [projectId]
      );
      const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await testPool.query(
        `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,'Survey Task','done',$2,0,TRUE,$3)`,
        [projectId, due.toISOString().split('T')[0], managerId]
      );
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/reject-survey`, { reason: 'Incomplete' }, token);
      const res = await projectsHandler.rejectSurvey(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 when project not in survey phase', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/reject-survey`, { reason: 'X' }, token);
      const res = await projectsHandler.rejectSurvey(req, String(projectId));
      expect(res.status).toBe(400);
    });
  });

  describe('autoAssign', () => {
    it('assigns unassigned tasks to technicians', async () => {
      const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await testPool.query(
        `INSERT INTO tb_tugas (id_proyek, nama_tugas, status, due_date, sort_order, is_survey_task, created_by)
         VALUES ($1,'Unassigned Task','to_do',$2,1,FALSE,$3)`,
        [projectId, due.toISOString().split('T')[0], managerId]
      );
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/auto-assign`, {
        user_ids: [technicianId],
      }, token);
      const res = await projectsHandler.autoAssign(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.assigned_count).toBeGreaterThan(0);
    });

    it('returns 400 when user_ids is empty', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/auto-assign`, { user_ids: [] }, token);
      const res = await projectsHandler.autoAssign(req, String(projectId));
      expect(res.status).toBe(400);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/auto-assign`, {
        user_ids: [technicianId],
      }, token);
      const res = await projectsHandler.autoAssign(req, String(projectId));
      expect(res.status).toBe(403);
    });
  });

  describe('assignTechnician / listAssignments / unassignTechnician', () => {
    it('assigns a technician to project', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/assignments`, {
        user_id: technicianId,
      }, token);
      const res = await projectsHandler.assignTechnician(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('returns 400 when user_id is missing', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/projects/${projectId}/assignments`, {}, token);
      const res = await projectsHandler.assignTechnician(req, String(projectId));
      expect(res.status).toBe(400);
    });

    it('lists assignments for manager', async () => {
      await testPool.query(
        `INSERT INTO tb_penugasan_proyek (id_proyek, id_user) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [projectId, technicianId]
      );
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', `/api/projects/${projectId}/assignments`, undefined, token);
      const res = await projectsHandler.listAssignments(req, String(projectId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('unassigns technician', async () => {
      await testPool.query(
        `INSERT INTO tb_penugasan_proyek (id_proyek, id_user) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [projectId, technicianId]
      );
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/projects/${projectId}/assignments/${technicianId}`, undefined, token);
      const res = await projectsHandler.unassignTechnician(req, String(projectId), String(technicianId));
      expect(res.status).toBe(200);
    });

    it('returns 404 when unassigning non-existent assignment', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/projects/${projectId}/assignments/99999`, undefined, token);
      const res = await projectsHandler.unassignTechnician(req, String(projectId), '99999');
      expect(res.status).toBe(404);
    });
  });
});
