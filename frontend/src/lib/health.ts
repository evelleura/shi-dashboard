// Klasifikasi status kesehatan proyek (RAG) berdasar nilai SPI.
// Ambang batas mengikuti Naskah TA — Gambar 5.10:
//   green  : SPI >= 0.95
//   amber  : 0.85 <= SPI < 0.95
//   red    : SPI <  0.85

export type StatusKesehatan = 'green' | 'amber' | 'red';

export function klasifikasiKesehatan(spi: number | null | undefined): StatusKesehatan {
  if (spi === null || spi === undefined || Number.isNaN(Number(spi))) return 'red';
  const nilai = Number(spi);
  if (nilai >= 0.95) return 'green';
  if (nilai >= 0.85) return 'amber';
  return 'red';
}

export function labelKesehatan(s: StatusKesehatan): string {
  if (s === 'green') return 'Tepat Waktu';
  if (s === 'amber') return 'Waspada';
  return 'Kritis';
}

// Urutan prioritas: merah dulu, lalu kuning, lalu hijau.
export function urutKekritisan(status: StatusKesehatan): number {
  if (status === 'red') return 1;
  if (status === 'amber') return 2;
  return 3;
}
