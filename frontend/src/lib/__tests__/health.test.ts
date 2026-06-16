// Klasifikasi status RAG berdasarkan ambang Gambar 5.10:
//  >= 0.95 -> green; 0.85 <= x < 0.95 -> amber; < 0.85 -> red.
import { describe, expect, it } from 'vitest';
import { klasifikasiKesehatan, labelKesehatan, urutKekritisan } from '@/lib/health';

describe('klasifikasiKesehatan', () => {
  it('SPI 1.00 -> green', () => expect(klasifikasiKesehatan(1.0)).toBe('green'));
  it('SPI 0.95 (batas bawah green) -> green', () => expect(klasifikasiKesehatan(0.95)).toBe('green'));
  it('SPI 0.9499 -> amber', () => expect(klasifikasiKesehatan(0.9499)).toBe('amber'));
  it('SPI 0.85 (batas bawah amber) -> amber', () => expect(klasifikasiKesehatan(0.85)).toBe('amber'));
  it('SPI 0.8499 -> red', () => expect(klasifikasiKesehatan(0.8499)).toBe('red'));
  it('SPI 0 -> red', () => expect(klasifikasiKesehatan(0)).toBe('red'));
  it('null -> red (gagal aman, tidak melempar)', () => expect(klasifikasiKesehatan(null)).toBe('red'));
  it('NaN -> red', () => expect(klasifikasiKesehatan(Number.NaN)).toBe('red'));
});

describe('labelKesehatan', () => {
  it('mengembalikan label Bahasa Indonesia', () => {
    expect(labelKesehatan('green')).toBe('Tepat Waktu');
    expect(labelKesehatan('amber')).toBe('Waspada');
    expect(labelKesehatan('red')).toBe('Kritis');
  });
});

describe('urutKekritisan', () => {
  it('merah lebih prioritas (nilai lebih kecil)', () => {
    expect(urutKekritisan('red')).toBeLessThan(urutKekritisan('amber'));
    expect(urutKekritisan('amber')).toBeLessThan(urutKekritisan('green'));
  });
});
