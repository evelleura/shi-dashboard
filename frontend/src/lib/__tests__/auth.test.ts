process.env.JWT_SECRET = 'SecretDian';


import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { authenticateRequest, authorizeRoles } from '../auth';

const JWT_SECRET = 'SecretDian';

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/test', { headers });
}

describe('auth.ts', () => {
  describe('authenticateRequest', () => {
    it('returns user payload for valid token', () => {
      const token = jwt.sign({ userId: 1, email: 'test@t.com', role: 'manager' }, JWT_SECRET);
      const req = makeRequest(`Bearer ${token}`);
      const result = authenticateRequest(req);
      expect(result.user).not.toBeNull();
      expect(result.user?.userId).toBe(1);
      expect(result.user?.role).toBe('manager');
    });

    it('returns null user for missing Authorization header', () => {
      const req = makeRequest();
      const result = authenticateRequest(req);
      expect(result.user).toBeNull();
    });

    it('returns 401 errorResponse for missing Authorization header', async () => {
      const req = makeRequest();
      const result = authenticateRequest(req);
      expect(result.errorResponse.status).toBe(401);
      const body = await result.errorResponse.json();
      expect(body.error).toBe('No token provided');
    });

    it('returns null user for header not starting with Bearer', () => {
      const token = jwt.sign({ userId: 1, email: 'x@t.com', role: 'admin' }, JWT_SECRET);
      const req = makeRequest(`Token ${token}`);
      const result = authenticateRequest(req);
      expect(result.user).toBeNull();
    });

    it('returns null user for expired token', () => {
      const token = jwt.sign({ userId: 1, email: 'x@t.com', role: 'admin' }, JWT_SECRET, { expiresIn: '-1s' });
      const req = makeRequest(`Bearer ${token}`);
      const result = authenticateRequest(req);
      expect(result.user).toBeNull();
    });

    it('returns 401 errorResponse for expired token', async () => {
      const token = jwt.sign({ userId: 1, email: 'x@t.com', role: 'admin' }, JWT_SECRET, { expiresIn: '-1s' });
      const req = makeRequest(`Bearer ${token}`);
      const result = authenticateRequest(req);
      expect(result.errorResponse.status).toBe(401);
      const body = await result.errorResponse.json();
      expect(body.error).toBe('Invalid or expired token');
    });

    it('returns null user for completely invalid token', () => {
      const req = makeRequest('Bearer not.a.valid.jwt');
      const result = authenticateRequest(req);
      expect(result.user).toBeNull();
    });

    it('returns null user for token signed with wrong secret', () => {
      const token = jwt.sign({ userId: 1, email: 'x@t.com', role: 'admin' }, 'wrong_secret');
      const req = makeRequest(`Bearer ${token}`);
      const result = authenticateRequest(req);
      expect(result.user).toBeNull();
    });

    it('correctly extracts all payload fields', () => {
      const token = jwt.sign({ userId: 42, email: 'admin@shi.com', role: 'technician' }, JWT_SECRET);
      const req = makeRequest(`Bearer ${token}`);
      const result = authenticateRequest(req);
      expect(result.user?.userId).toBe(42);
      expect(result.user?.email).toBe('admin@shi.com');
      expect(result.user?.role).toBe('technician');
    });
  });

  describe('authorizeRoles', () => {
    const makeUser = (role: 'technician' | 'manager' | 'admin') => ({
      userId: 1,
      email: 'x@t.com',
      role,
    });

    it('returns null when role is in allowed list', () => {
      const result = authorizeRoles(makeUser('manager'), ['manager', 'admin']);
      expect(result).toBeNull();
    });

    it('returns null for admin when admin is allowed', () => {
      const result = authorizeRoles(makeUser('admin'), ['admin']);
      expect(result).toBeNull();
    });

    it('returns null for technician when technician is allowed', () => {
      const result = authorizeRoles(makeUser('technician'), ['technician']);
      expect(result).toBeNull();
    });

    it('returns 403 response when role is not in allowed list', async () => {
      const result = authorizeRoles(makeUser('technician'), ['manager', 'admin']);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
      const body = await result?.json();
      expect(body.error).toBe('Access denied');
    });

    it('returns 403 when manager tries admin-only endpoint', async () => {
      const result = authorizeRoles(makeUser('manager'), ['admin']);
      expect(result?.status).toBe(403);
    });

    it('returns null when all roles are allowed', () => {
      const result = authorizeRoles(makeUser('technician'), ['technician', 'manager', 'admin']);
      expect(result).toBeNull();
    });
  });
});
