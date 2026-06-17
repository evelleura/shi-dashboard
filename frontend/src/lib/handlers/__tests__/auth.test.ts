// Must set env BEFORE any imports that touch the db module
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
import * as authHandler from '../auth';

const testPool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'shi_test',
  user: 'postgres',
  password: 'postgres',
});

function makeRequest(method: string, url: string, body?: object, authToken?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeAll(async () => {
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await testPool.query(`TRUNCATE TABLE tb_user RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await testPool.end();
});

describe('Auth Handler', () => {
  describe('login', () => {
    it('returns 200 with token on valid credentials', async () => {
      const hash = await bcrypt.hash('Password123!', 10);
      await testPool.query(
        `INSERT INTO tb_user (nama, email, role, password) VALUES ($1, $2, $3, $4)`,
        ['Test Manager', 'manager@test.com', 'manajer', hash]
      );
      const req = makeRequest('POST', '/api/auth/login', {
        email: 'manager@test.com',
        password: 'Password123!',
      });
      const res = await authHandler.login(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeTruthy();
      expect(body.data.user.email).toBe('manager@test.com');
      expect(body.data.user.role).toBe('manajer');
    });

    it('returns 401 on wrong password', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 10);
      await testPool.query(
        `INSERT INTO tb_user (nama, email, role, password) VALUES ($1,$2,$3,$4)`,
        ['U', 'u@t.com', 'teknisi', hash]
      );
      const req = makeRequest('POST', '/api/auth/login', { email: 'u@t.com', password: 'WrongPassword' });
      const res = await authHandler.login(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 on non-existent user', async () => {
      const req = makeRequest('POST', '/api/auth/login', { email: 'nobody@test.com', password: 'any' });
      const res = await authHandler.login(req);
      const body = await res.json();
      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 400 on missing email', async () => {
      const req = makeRequest('POST', '/api/auth/login', { password: 'any' });
      const res = await authHandler.login(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 on missing password', async () => {
      const req = makeRequest('POST', '/api/auth/login', { email: 'test@test.com' });
      const res = await authHandler.login(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 on empty body', async () => {
      const req = makeRequest('POST', '/api/auth/login', {});
      const res = await authHandler.login(req);
      expect(res.status).toBe(400);
    });
  });

  describe('register', () => {
    it('creates a new technician and returns 201 with token', async () => {
      const req = makeRequest('POST', '/api/auth/register', {
        name: 'New Tech',
        email: 'newtech@test.com',
        password: 'Password123!',
        role: 'teknisi',
      });
      const res = await authHandler.register(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeTruthy();
      expect(body.data.user.role).toBe('teknisi');
    });

    it('creates a manager when role=manager', async () => {
      const req = makeRequest('POST', '/api/auth/register', {
        name: 'New Manager',
        email: 'newmgr@test.com',
        password: 'Password123!',
        role: 'manajer',
      });
      const res = await authHandler.register(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.user.role).toBe('manajer');
    });

    it('defaults to technician for unknown role', async () => {
      const req = makeRequest('POST', '/api/auth/register', {
        name: 'Someone',
        email: 'someone@test.com',
        password: 'Password123!',
        role: 'admin', // admin is not in allowedRoles for register
      });
      const res = await authHandler.register(req);
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.user.role).toBe('teknisi');
    });

    it('returns 409 on duplicate email', async () => {
      const hash = await bcrypt.hash('pw', 10);
      await testPool.query(
        `INSERT INTO tb_user (nama, email, role, password) VALUES ($1,$2,$3,$4)`,
        ['U', 'dup@t.com', 'teknisi', hash]
      );
      const req = makeRequest('POST', '/api/auth/register', {
        name: 'U2',
        email: 'dup@t.com',
        password: 'pw2',
        role: 'teknisi',
      });
      const res = await authHandler.register(req);
      expect(res.status).toBe(409);
    });

    it('returns 400 on missing name', async () => {
      const req = makeRequest('POST', '/api/auth/register', {
        email: 'x@t.com',
        password: 'pw',
      });
      const res = await authHandler.register(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 on missing email', async () => {
      const req = makeRequest('POST', '/api/auth/register', {
        name: 'Test',
        password: 'pw',
      });
      const res = await authHandler.register(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 on missing password', async () => {
      const req = makeRequest('POST', '/api/auth/register', {
        name: 'Test',
        email: 'x@t.com',
      });
      const res = await authHandler.register(req);
      expect(res.status).toBe(400);
    });
  });
});
