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
import * as auditHandler from '../audit';

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

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`TRUNCATE TABLE audit_log, tb_user RESTART IDENTITY CASCADE`);

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
    ['Admin', 'admin@t.com', 'admin', hash]
  );
  adminId = adm.rows[0].id;

  // Seed some audit log entries
  await testPool.query(`
    INSERT INTO audit_log (entity_type, entity_id, entity_name, action, field_name, old_value, new_value, changed_by, changed_by_name)
    VALUES
      ('project', 1, 'Test Project', 'create', '*', NULL, 'Test Project', $1, 'Manager'),
      ('task', 1, 'Test Task', 'update', 'status', 'to_do', 'working_on_it', $1, 'Manager'),
      ('user', $2, 'Tech', 'update', 'name', 'Old Tech', 'Tech', $1, 'Manager')
  `, [managerId, technicianId]);
});

afterAll(async () => {
  await testPool.end();
});

describe('Audit Handler', () => {
  describe('listAuditLogs', () => {
    // Log audit GLOBAL (tanpa entity_id) = eksklusif admin (AUDIT_VIEW).
    it('returns global audit logs for admin', async () => {
      const token = makeToken(adminId, 'admin', 'admin@t.com');
      const req = makeRequest('GET', '/api/audit', undefined, token);
      const res = await auditHandler.listAuditLogs(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data.logs)).toBe(true);
      expect(typeof body.data.total).toBe('number');
      expect(body.data.logs.length).toBeGreaterThanOrEqual(3);
    });

    it('returns 403 on global audit log for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = makeRequest('GET', '/api/audit', undefined, token);
      const res = await auditHandler.listAuditLogs(req);
      expect(res.status).toBe(403);
    });

    it('returns 403 on global audit log for technician', async () => {
      const token = makeToken(technicianId, 'teknisi', 'tech@t.com');
      const req = makeRequest('GET', '/api/audit', undefined, token);
      const res = await auditHandler.listAuditLogs(req);
      expect(res.status).toBe(403);
    });

    // Riwayat ENTITAS spesifik (ada entity_id) = operasional -> manajer + admin.
    it('returns scoped entity history for manager', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = new NextRequest('http://localhost:3000/api/audit?entity_type=task&entity_id=1', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await auditHandler.listAuditLogs(req);
      expect(res.status).toBe(200);
    });

    it('filters by entity_type (global -> admin)', async () => {
      const token = makeToken(adminId, 'admin', 'admin@t.com');
      const req = new NextRequest('http://localhost:3000/api/audit?entity_type=project', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await auditHandler.listAuditLogs(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      for (const log of body.data.logs) {
        expect(log.entity_type).toBe('project');
      }
    });

    it('filters by entity_id', async () => {
      const token = makeToken(managerId, 'manajer', 'mgr@t.com');
      const req = new NextRequest('http://localhost:3000/api/audit?entity_id=1', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await auditHandler.listAuditLogs(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      for (const log of body.data.logs) {
        expect(log.entity_id).toBe(1);
      }
    });

    it('respects limit parameter', async () => {
      const token = makeToken(adminId, 'admin', 'admin@t.com');
      const req = new NextRequest('http://localhost:3000/api/audit?limit=2', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await auditHandler.listAuditLogs(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.logs.length).toBeLessThanOrEqual(2);
    });

    it('caps limit at 200', async () => {
      const token = makeToken(adminId, 'admin', 'admin@t.com');
      const req = new NextRequest('http://localhost:3000/api/audit?limit=999', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const res = await auditHandler.listAuditLogs(req);
      // Should not error, limit is capped
      expect(res.status).toBe(200);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', '/api/audit');
      const res = await auditHandler.listAuditLogs(req);
      expect(res.status).toBe(401);
    });
  });

  describe('logChange', () => {
    it('inserts audit log entries', async () => {
      await auditHandler.logChange({
        entityType: 'client',
        entityId: 99,
        entityName: 'Test Client',
        action: 'update',
        changes: [
          { field: 'name', oldValue: 'Old Name', newValue: 'New Name' },
          { field: 'phone', oldValue: '0811', newValue: '0822' },
        ],
        userId: managerId,
        userName: 'Manager',
      });

      const result = await testPool.query(
        `SELECT * FROM audit_log WHERE entity_id=99 AND entity_type='client' ORDER BY created_at ASC`
      );
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].field_name).toBe('name');
      expect(result.rows[1].field_name).toBe('phone');
    });

    it('handles single change', async () => {
      await auditHandler.logChange({
        entityType: 'user',
        entityId: 55,
        entityName: 'Some User',
        action: 'delete',
        changes: [{ field: '*', oldValue: 'Some User', newValue: null }],
        userId: managerId,
        userName: 'Manager',
      });

      const result = await testPool.query(
        `SELECT * FROM audit_log WHERE entity_id=55`
      );
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].action).toBe('delete');
    });
  });
});
