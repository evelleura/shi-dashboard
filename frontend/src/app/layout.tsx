import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dasbor SHI — Pemantauan Proyek Berbasis Laporan Harian',
  description: 'PT Smart Home Inovasi Yogyakarta — Tugas Akhir Dian Putri Iswandi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
