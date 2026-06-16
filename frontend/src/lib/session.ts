// Helper sesi berbasis cookie (Server Component / Route Handler).
import { cookies } from 'next/headers';
import { verifyToken, type PenggunaSesi } from './auth';

export const COOKIE_NAME = 'shi_session';

export async function getSesi(): Promise<PenggunaSesi | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSesi(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function hapusSesi(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
