import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'technician' | 'manager' | 'admin';
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

export function authorizeRoles(
  user: JwtPayload,
  roles: string[]
): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied' },
      { status: 403 }
    );
  }
  return null;
}
