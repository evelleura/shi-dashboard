// Helper sesi untuk pengujian. vi.mock('next/headers') HARUS dilakukan
// di file test agar di-hoist oleh vitest.
import { signToken, type PenggunaSesi } from '@/lib/auth';

const store = new Map<string, string>();

export const cookieMock = {
  get(name: string) {
    const v = store.get(name);
    return v ? { name, value: v } : undefined;
  },
  set(name: string, value: string) { store.set(name, value); },
  delete(name: string) { store.delete(name); },
  reset() { store.clear(); },
};

export function loginSebagai(user: PenggunaSesi) {
  const token = signToken(user);
  cookieMock.set('shi_session', token);
}
