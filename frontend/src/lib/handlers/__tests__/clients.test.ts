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
import * as clientsHandler from '../clients';

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
let adminId: number;
let clientId: number;

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

  const adm = await testPool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Admin', 'admin@t.com', 'admin', hash]
  );
  adminId = adm.rows[0].id;

  const cl = await testPool.query(
    `INSERT INTO clients (name, address, phone, email, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    ['PT Test Client', 'Jl. Test 1', '08123', 'client@test.com', managerId]
  );
  clientId = cl.rows[0].id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Clients Handler', () => {
  describe('listClients', () => {
    it('returns clients list for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/clients', undefined, token);
      const res = await clientsHandler.listClients(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('GET', '/api/clients', undefined, token);
      const res = await clientsHandler.listClients(req);
      expect(res.status).toBe(403);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', '/api/clients');
      const res = await clientsHandler.listClients(req);
      expect(res.status).toBe(401);
    });
  });

  describe('createClient', () => {
    it('creates a client for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/clients', {
        name: 'New Client',
        address: 'Jl. New 1',
        phone: '0812345',
        email: 'new@client.com',
      }, token);
      const res = await clientsHandler.createClient(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.name).toBe('New Client');
    });

    it('returns 400 when name is missing', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/clients', { address: 'Jl.' }, token);
      const res = await clientsHandler.createClient(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when name is empty', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/clients', { name: '   ' }, token);
      const res = await clientsHandler.createClient(req);
      expect(res.status).toBe(400);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('POST', '/api/clients', { name: 'Client' }, token);
      const res = await clientsHandler.createClient(req);
      expect(res.status).toBe(403);
    });

    it('accepts optional latitude/longitude', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('POST', '/api/clients', {
        name: 'Geo Client',
        latitude: -7.797068,
        longitude: 110.370529,
      }, token);
      const res = await clientsHandler.createClient(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(parseFloat(body.data.latitude)).toBeCloseTo(-7.797068, 3);
    });
  });

  describe('getClient', () => {
    it('returns client details for any authenticated user', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', `/api/clients/${clientId}`, undefined, token);
      const res = await clientsHandler.getClient(req, String(clientId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.id).toBe(clientId);
      expect(Array.isArray(body.data.projects)).toBe(true);
    });

    it('returns 404 for non-existent client', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/clients/99999', undefined, token);
      const res = await clientsHandler.getClient(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid client ID', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('GET', '/api/clients/abc', undefined, token);
      const res = await clientsHandler.getClient(req, 'abc');
      expect(res.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const req = makeRequest('GET', `/api/clients/${clientId}`);
      const res = await clientsHandler.getClient(req, String(clientId));
      expect(res.status).toBe(401);
    });
  });

  describe('updateClient', () => {
    it('updates client for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', `/api/clients/${clientId}`, { name: 'Updated Client' }, token);
      const res = await clientsHandler.updateClient(req, String(clientId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.name).toBe('Updated Client');
    });

    it('returns 400 if updated name is empty', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', `/api/clients/${clientId}`, { name: '' }, token);
      const res = await clientsHandler.updateClient(req, String(clientId));
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent client', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('PUT', '/api/clients/99999', { name: 'X' }, token);
      const res = await clientsHandler.updateClient(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 403 for technician', async () => {
      const token = makeToken(technicianId, 'technician', 'tech@t.com');
      const req = makeRequest('PUT', `/api/clients/${clientId}`, { name: 'X' }, token);
      const res = await clientsHandler.updateClient(req, String(clientId));
      expect(res.status).toBe(403);
    });
  });

  describe('deleteClient', () => {
    it('deletes client for admin', async () => {
      const token = makeToken(adminId, 'admin', 'admin@t.com');
      const req = makeRequest('DELETE', `/api/clients/${clientId}`, undefined, token);
      const res = await clientsHandler.deleteClient(req, String(clientId));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 403 for manager', async () => {
      const token = makeToken(managerId, 'manager', 'mgr@t.com');
      const req = makeRequest('DELETE', `/api/clients/${clientId}`, undefined, token);
      const res = await clientsHandler.deleteClient(req, String(clientId));
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent client', async () => {
      const token = makeToken(adminId, 'admin', 'admin@t.com');
      const req = makeRequest('DELETE', '/api/clients/99999', undefined, token);
      const res = await clientsHandler.deleteClient(req, '99999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid client ID', async () => {
      const token = makeToken(adminId, 'admin', 'admin@t.com');
      const req = makeRequest('DELETE', '/api/clients/abc', undefined, token);
      const res = await clientsHandler.deleteClient(req, 'abc');
      expect(res.status).toBe(400);
    });
  });
});
