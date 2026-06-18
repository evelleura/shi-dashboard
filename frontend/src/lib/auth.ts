import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { type Role, type Permission, roleCan, satisfiesAnyRole } from '@/lib/rbac';

export interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
}

function forbidden(): NextResponse {
  return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
}

export interface AuthResult {
  user: JwtPayload | null;
  errorResponse: NextResponse;
}

export function authenticateRequest(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;
    return {
      user: payload,
      errorResponse: null as never,
    };
  } catch {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Gerbang berbasis daftar-peran (legacy, hierarchy-aware).
 * Admin memenuhi 'manajer' lewat hierarki peran, jadi seluruh endpoint manajer
 * otomatis terbuka utk admin tanpa mengubah pemanggil. Untuk endpoint baru,
 * lebih disukai `requirePermission`.
 */
export function authorizeRoles(
  user: JwtPayload,
  roles: string[]
): NextResponse | null {
  if (!satisfiesAnyRole(user.role, roles)) return forbidden();
  return null;
}

/**
 * Gerbang berbasis kapabilitas (disukai). Memetakan peran -> kapabilitas via
 * matriks RBAC terpusat. Endpoint eksklusif-admin (kelola pengguna, log audit)
 * memakai ini sehingga manajer tertolak 403 sementara admin lolos.
 */
export function requirePermission(
  user: JwtPayload,
  permission: Permission
): NextResponse | null {
  if (!roleCan(user.role, permission)) return forbidden();
  return null;
}
