// Pengujian kalkulasi Schedule Performance Index (SPI).
// Mengacu pada Tabel 4.5 (Kelas Kesehatan Proyek) dan Gambar 5.10.
import { describe, expect, it } from 'vitest';
import { hitungSPI, hitungPlannedValue, hitungEarnedValue } from '@/lib/spi';

describe('hitungPlannedValue', () => {
  it('mengembalikan 0 jika proyek belum dimulai', () => {
    const start = new Date('2026-06-10');
    const end = new Date('2026-07-10');
    const now = new Date('2026-06-01');
    expect(hitungPlannedValue(start, end, now)).toBe(0);
  });
  it('mengembalikan 100 jika sudah melewati tenggat', () => {
    const start = new Date('2026-04-01');
    const end = new Date('2026-04-30');
    const now = new Date('2026-06-15');
    expect(hitungPlannedValue(start, end, now)).toBe(100);
  });
  it('mengembalikan 50 di tengah durasi proyek', () => {
    const start = new Date('2026-06-01');
    const end = new Date('2026-06-11'); // 10 hari
    const now = new Date('2026-06-06'); // 5 hari berjalan
    expect(hitungPlannedValue(start, end, now)).toBeCloseTo(50, 5);
  });
  it('aman terhadap end_date == start_date', () => {
    const d = new Date('2026-06-10');
    expect(hitungPlannedValue(d, d, d)).toBe(100);
  });
});

describe('hitungEarnedValue', () => {
  it('0 jika total tugas 0', () => {
    expect(hitungEarnedValue(0, 0)).toBe(0);
  });
  it('dibatasi 100% meski selesai > total', () => {
    expect(hitungEarnedValue(10, 50)).toBe(100);
  });
  it('proporsional pada nilai normal', () => {
    expect(hitungEarnedValue(10, 4)).toBe(40);
  });
  it('menolak nilai negatif (diperlakukan sebagai 0)', () => {
    expect(hitungEarnedValue(10, -5)).toBe(0);
  });
  it('aman terhadap NaN', () => {
    expect(hitungEarnedValue(Number.NaN, 1)).toBe(0);
    expect(hitungEarnedValue(10, Number.NaN)).toBe(0);
  });
});

describe('hitungSPI', () => {
  it('SPI = EV / PV (proyek tepat sesuai jadwal -> 1.0)', () => {
    const r = hitungSPI({
      startDate: '2026-06-01',
      endDate:   '2026-06-11',
      totalTugas: 10,
      tugasSelesai: 5,
      hariIni: new Date('2026-06-06'), // PV 50, EV 50
    });
    expect(r.spi).toBeCloseTo(1.0, 4);
  });
  it('SPI < 1 jika realisasi tertinggal', () => {
    const r = hitungSPI({
      startDate: '2026-06-01', endDate: '2026-06-11',
      totalTugas: 10, tugasSelesai: 2,
      hariIni: new Date('2026-06-06'), // PV 50, EV 20
    });
    expect(r.spi).toBeCloseTo(0.4, 4);
  });
  it('SPI > 1 jika realisasi lebih cepat', () => {
    const r = hitungSPI({
      startDate: '2026-06-01', endDate: '2026-06-11',
      totalTugas: 10, tugasSelesai: 8,
      hariIni: new Date('2026-06-06'), // PV 50, EV 80
    });
    expect(r.spi).toBeCloseTo(1.6, 4);
  });
  it('SPI = 0 jika PV = 0 (proyek belum mulai) — aman dari pembagian nol', () => {
    const r = hitungSPI({
      startDate: '2026-06-10', endDate: '2026-07-10',
      totalTugas: 5, tugasSelesai: 0,
      hariIni: new Date('2026-06-01'),
    });
    expect(r.spi).toBe(0);
  });
});
