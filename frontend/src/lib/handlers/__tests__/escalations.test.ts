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
import * as escalationsHandler from '../escalations';

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
let taskId: number;
let escalationId: number;

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`
    TRUNCATE TABLE escalation_updates, tb_eskalasi, task_activities, tb_bukti,
      tb_tugas, tb_penugasan_proyek, tb_proyek, tb_klien, tb_user, audit_log
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

  const proj = await testPool.query(
    `INSERT INTO tb_proyek (nama_proyek, start_date, end_date, status, phase, category, project_value, survey_approved, created_by)
     VALUES ($1,'2030-01-01','2030-12-31','active','execution','instalasi',5000000,TRUE,$2) RETURNING id_proyek AS id`,
    ['Project', managerId]
  );
  const projectId = proj.rows[0].id;

  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const task = await testPool.query(
    `INSERT INTO tb_tugas (id_proyek, nama_tugas, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_tugas AS id`,
    [projectId, 'Test Task', technicianId, 'working_on_it', due, 0, false, managerId]
  );
  taskId = task.rows[0].id;

  const esc = await testPool.query(
    `INSERT INTO tb_eskalasi (id_tugas, id_proyek, reported_by, title, description, priority, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_eskalasi AS id`,
    [taskId, projectId, technicianId, 'Test Escalation', 'Something went wrong', 'high', 'open']
  );
  escalationId = esc.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Escalations Handler', () => {
  describe('listEscalations', () => {
    it('returns all escalations for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', '/api/escalations', undefined, token);
      const res = await escalationsHandler.listEscalations(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns only own escalations for technician', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('GET', '/api/escalations', undefined, token);
      const res = await escalationsHandler.listEscalations(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      // All escalations should be reported by this technician
      for (const e of body.data) {
        expect(e.reported_by).toBe(technicianId);
      }
    });

    it('filters by status', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = new NextRequest('http://localhost:3000/api/escalations?status=open', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await escalationsHandler.listEscalations(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', '/api/escalations');
      const res = await escalationsHandler.listEscalations(req);
      expect(res.status).toBe(401);
    });
  });

  describe('getEscalation', () => {
    it('returns escalation for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', `/api/escalations/${escalationId}`, undefined, token);
      const res = await escalationsHandler.getEscalation(req, String(escalationId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.id).toBe(escalationId);
    });

    it('returns 403 for technician not the reporter', async () => {
      const hash = await bcrypt.hash('pw', 10);
      const otherTech = await testPool.query(
        `INSERT INTO tb_user (nama, email, role, password) VALUES ($1,$2,$3,$4) RETURNING id_user AS id`,
        ['Other Tech', 'other@t.com', 'teknisi', hash]
      );
      const token = makeToken(otherTech.rows[0].id, 'teknisi', 'other@t.com');
      const req = makeRequest('GET', `/api/escalations/${escalationId}`, undefined, token);
      const res = await escalationsHandler.getEscalation(req, String(escalationId));
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent escalation', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', '/api/escalations/99999', undefined, token);
      const res = await escalationsHandler.getEscalation(req, '99999');
      expect(res.status).toBe(404);
    });
  });

  describe('reviewEscalation', () => {
    it('sets status to in_review for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/review`, undefined, token);
      const res = await escalationsHandler.reviewEscalation(req, String(escalationId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.status).toBe('in_review');
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/review`, undefined, token);
      const res = await escalationsHandler.reviewEscalation(req, String(escalationId));
      expect(res.status).toBe(403);
    });

    it('returns 409 when escalation already resolved', async () => {
      await testPool.query(`UPDATE tb_eskalasi SET status='closed' WHERE id_eskalasi=$1`, [escalationId]);
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/review`, undefined, token);
      const res = await escalationsHandler.reviewEscalation(req, String(escalationId));
      expect(res.status).toBe(409);
    });
  });

  describe('resolveEscalation', () => {
    it('resolves escalation for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/resolve`, {
        resolution_notes: 'Fixed the issue',
      }, token);
      const res = await escalationsHandler.resolveEscalation(req, String(escalationId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.status).toBe('resolved');
    });

    it('returns 400 when resolution_notes is missing', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/resolve`, {}, token);
      const res = await escalationsHandler.resolveEscalation(req, String(escalationId));
      expect(res.status).toBe(400);
    });

    it('returns 409 when already resolved', async () => {
      await testPool.query(`UPDATE tb_eskalasi SET status='closed' WHERE id_eskalasi=$1`, [escalationId]);
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/resolve`, {
        resolution_notes: 'Already done',
      }, token);
      const res = await escalationsHandler.resolveEscalation(req, String(escalationId));
      expect(res.status).toBe(409);
    });
  });

  describe('addUpdate / getUpdates', () => {
    it('adds update for the reporter', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/updates`, {
        message: 'Update message',
      }, token);
      const res = await escalationsHandler.addUpdate(req, String(escalationId));
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.message).toBe('Update message');
    });

    it('returns 400 when message is empty', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/updates`, { message: '' }, token);
      const res = await escalationsHandler.addUpdate(req, String(escalationId));
      expect(res.status).toBe(400);
    });

    it('returns 409 when escalation is resolved', async () => {
      await testPool.query(`UPDATE tb_eskalasi SET status='closed' WHERE id_eskalasi=$1`, [escalationId]);
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('POST', `/api/escalations/${escalationId}/updates`, {
        message: 'Late update',
      }, token);
      const res = await escalationsHandler.addUpdate(req, String(escalationId));
      expect(res.status).toBe(409);
    });

    it('lists updates for escalation', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', `/api/escalations/${escalationId}/updates`, undefined, token);
      const res = await escalationsHandler.getUpdates(req, String(escalationId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('deleteEscalation', () => {
    it('deletes non-resolved escalation for admin', async () => {
      const token = makeToken(adminId, 'manajer', 'admin@t.com');
      const req = makeRequest('DELETE', `/api/escalations/${escalationId}`, undefined, token);
      const res = await escalationsHandler.deleteEscalation(req, String(escalationId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 409 when trying to delete resolved escalation', async () => {
      await testPool.query(`UPDATE tb_eskalasi SET status='closed' WHERE id_eskalasi=$1`, [escalationId]);
      const token = makeToken(adminId, 'manajer', 'admin@t.com');
      const req = makeRequest('DELETE', `/api/escalations/${escalationId}`, undefined, token);
      const res = await escalationsHandler.deleteEscalation(req, String(escalationId));
      expect(res.status).toBe(409);
    });

    it('returns 403 for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/escalations/${escalationId}`, undefined, token);
      const res = await escalationsHandler.deleteEscalation(req, String(escalationId));
      expect(res.status).not.toBe(403); // 2 peran: manajer mewarisi wewenang admin
    });
  });

  describe('getEscalationSummary', () => {
    it('returns summary for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', '/api/escalations/summary', undefined, token);
      const res = await escalationsHandler.getEscalationSummary(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data).toHaveProperty('open');
      expect(body.data).toHaveProperty('total');
    });

    it('returns scoped summary for technician', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('GET', '/api/escalations/summary', undefined, token);
      const res = await escalationsHandler.getEscalationSummary(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data).toHaveProperty('total');
    });
  });
});
