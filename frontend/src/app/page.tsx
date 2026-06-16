// Halaman Beranda publik (Gambar 5.23). Menyambut pengunjung dan
// mengarahkan ke halaman Masuk.
import Link from 'next/link';
import { getSesi } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function Beranda() {
  const u = await getSesi();
  if (u) redirect('/dashboard');
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-lg font-bold">
          SHI
        </div>
        <p className="mb-3 text-xs uppercase tracking-widest text-slate-400">
          Dibuat oleh @dianputriiswandi
        </p>
        <h1 className="mb-4 text-4xl font-bold sm:text-6xl">
          <span className="text-white">PAKAR TEKNOLOGI</span>
          <br />
          <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">RUMAH PINTAR</span>
        </h1>
        <p className="mb-8 max-w-2xl text-base text-slate-300">
          Sistem kendali terpadu untuk hampir semua aspek rumah maupun bisnis Anda.
        </p>
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg"
        >
          Masuk
        </Link>
        <p className="mt-12 text-xs text-slate-500">
          Tugas Akhir — Dian Putri Iswandi 5220311118 · Universitas Teknologi Yogyakarta 2026
        </p>
      </div>
    </main>
  );
}
