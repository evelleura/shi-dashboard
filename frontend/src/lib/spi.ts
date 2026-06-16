// Modul kalkulasi Schedule Performance Index (SPI).
// SPI = Earned Value / Planned Value
//   - Planned Value (PV) = (hari berjalan / total hari) * 100
//   - Earned Value (EV)  = (tugas selesai / total tugas) * 100
// Sumber: Naskah TA — Kelas KesehatanProyek (Tabel 4.5).

export interface InputSPI {
  startDate: Date | string;
  endDate: Date | string;
  totalTugas: number;
  tugasSelesai: number;
  hariIni?: Date;
}

export interface HasilSPI {
  spi: number;            // dibulatkan 4 desimal; 0 jika PV=0
  plannedProgress: number; // 0..100
  actualProgress: number;  // 0..100
  deviationPercent: number; // actual - planned
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function selisihHari(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function hitungPlannedValue(start: Date, end: Date, sekarang: Date): number {
  const total = selisihHari(end, start);
  if (total <= 0) return 100;
  const berjalan = selisihHari(sekarang, start);
  if (berjalan <= 0) return 0;
  if (berjalan >= total) return 100;
  return (berjalan / total) * 100;
}

export function hitungEarnedValue(total: number, selesai: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(selesai) || selesai < 0) return 0;
  const capped = Math.min(selesai, total);
  return (capped / total) * 100;
}

export function hitungSPI(input: InputSPI): HasilSPI {
  const start = toDate(input.startDate);
  const end = toDate(input.endDate);
  const sekarang = input.hariIni ?? new Date();
  const planned = hitungPlannedValue(start, end, sekarang);
  const actual = hitungEarnedValue(input.totalTugas, input.tugasSelesai);
  const spi = planned === 0 ? 0 : Math.round((actual / planned) * 10000) / 10000;
  return {
    spi,
    plannedProgress: Math.round(planned * 100) / 100,
    actualProgress: Math.round(actual * 100) / 100,
    deviationPercent: Math.round((actual - planned) * 100) / 100,
  };
}
