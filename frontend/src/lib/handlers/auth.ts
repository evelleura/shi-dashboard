import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function login(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
  }

  try {
    const result = await query<{ id: number; name: string; email: string; role: string; password_hash: string }>(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1', [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret'
    );

    return NextResponse.json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function register(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
  }

  const allowedRoles = ['technician', 'manager'];
  const userRole = allowedRoles.includes(role) ? role : 'technician';

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query<{ id: number; name: string; email: string; role: string }>(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, userRole, hash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret'
    );

    return NextResponse.json(
      { success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } },
      { status: 201 }
    );
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
