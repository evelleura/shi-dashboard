// Modul autentikasi: hash password + token JWT.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type Peran = 'manager' | 'technician';

export interface PenggunaSesi {
  id: number;
  email: string;
  nama: string;
  role: Peran;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'SecretDian';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 6) {
    throw new Error('Password minimal 6 karakter');
  }
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: PenggunaSesi): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string): PenggunaSesi | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PenggunaSesi & { iat?: number; exp?: number };
    return { id: decoded.id, email: decoded.email, nama: decoded.nama, role: decoded.role };
  } catch {
    return null;
  }
}

export function pastikanPeran(user: PenggunaSesi | null, peran: Peran): asserts user is PenggunaSesi {
  if (!user) throw new Error('Belum login');
  if (user.role !== peran) throw new Error(`Hak akses ditolak: butuh peran ${peran}`);
}
