// Pengujian modul autentikasi (hash, JWT, validasi peran).
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken, pastikanPeran } from '@/lib/auth';

describe('hashPassword & verifyPassword', () => {
  it('hash menghasilkan string non-kosong dan berbeda tiap panggilan', async () => {
    const h1 = await hashPassword('rahasia123');
    const h2 = await hashPassword('rahasia123');
    expect(h1).toBeTruthy();
    expect(h2).toBeTruthy();
    expect(h1).not.toBe(h2); // bcrypt salt → hash berbeda
  });
  it('verifyPassword cocok untuk plaintext yang benar', async () => {
    const h = await hashPassword('rahasia123');
    expect(await verifyPassword('rahasia123', h)).toBe(true);
  });
  it('verifyPassword menolak plaintext yang salah', async () => {
    const h = await hashPassword('rahasia123');
    expect(await verifyPassword('rahasia124', h)).toBe(false);
  });
  it('verifyPassword false untuk input kosong (gagal aman)', async () => {
    expect(await verifyPassword('', 'apapun')).toBe(false);
    expect(await verifyPassword('rahasia', '')).toBe(false);
  });
  it('hashPassword menolak password terlalu pendek', async () => {
    await expect(hashPassword('123')).rejects.toThrow(/minimal/);
  });
});

describe('signToken & verifyToken', () => {
  it('round-trip token mengembalikan payload yang sama', () => {
    const t = signToken({ id: 1, email: 'x@y.id', nama: 'X', role: 'manager' });
    const d = verifyToken(t);
    expect(d).toMatchObject({ id: 1, email: 'x@y.id', nama: 'X', role: 'manager' });
  });
  it('token rusak/dipalsukan dikembalikan null (tidak melempar)', () => {
    expect(verifyToken('bukan.jwt.beneran')).toBeNull();
  });
  it('token dengan tanda tangan yang dimodifikasi ditolak', () => {
    const t = signToken({ id: 1, email: 'x@y.id', nama: 'X', role: 'manager' });
    const tampered = t.slice(0, -3) + 'AAA';
    expect(verifyToken(tampered)).toBeNull();
  });
  it('token kosong dikembalikan null', () => {
    expect(verifyToken('')).toBeNull();
  });
});

describe('pastikanPeran', () => {
  it('lolos jika peran sesuai', () => {
    const u = { id: 1, email: 'x', nama: 'X', role: 'manager' as const };
    expect(() => pastikanPeran(u, 'manager')).not.toThrow();
  });
  it('melempar jika peran tidak sesuai', () => {
    const u = { id: 1, email: 'x', nama: 'X', role: 'technician' as const };
    expect(() => pastikanPeran(u, 'manager')).toThrow(/Hak akses/);
  });
  it('melempar jika user null (belum login)', () => {
    expect(() => pastikanPeran(null, 'manager')).toThrow(/Belum login/);
  });
});
