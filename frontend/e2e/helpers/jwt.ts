import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const JWT_SECRET = process.env.JWT_SECRET || 'SecretDian';

export interface TestTokenPayload {
  userId: number;
  role: 'technician' | 'manager' | 'admin';
  email: string;
  name?: string;
}

export function signTestToken(payload: TestTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}
