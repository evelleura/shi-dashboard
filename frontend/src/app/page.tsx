// Halaman Beranda (Gambar 5.23 Naskah TA Final 4) — gerbang akses utama.
// Desain dark minimalis dengan aksen gradien pink→purple pada tipografi
// dan tombol "Sign In". Bila sudah login, otomatis redirect ke dashboard.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSesi } from '@/lib/session';

function ParticleBg() {
  return (
    <>
      <div className="absolute left-[8%] top-[15%] h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute right-[6%] top-[10%] h-12 w-12 rounded-full border border-white/10" />
      <div className="absolute left-[12%] bottom-[20%] h-20 w-20 rounded-full border border-white/5" />
      <div className="absolute right-[15%] bottom-[15%] h-14 w-14 rounded-full bg-white/5 blur-xl" />
      {/* Pojok kiri bawah: huruf N dekoratif */}
      <span className="absolute bottom-6 left-6 text-xs font-bold tracking-widest text-white/40">N</span>
    </>
  );
}

export default async function Beranda() {
  const u = await getSesi();
  if (u) redirect(u.role === 'manager' ? '/dashboard' : '/dashboard');

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <ParticleBg />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        {/* Logo SHI kotak gradien */}
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-sm font-extrabold shadow-lg shadow-purple-900/40">
          SHI
        </div>

        {/* Kredit pembuat */}
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Created by @dianputriiswandi
        </p>

        {/* Headline besar */}
        <h1 className="mb-5 text-5xl font-extrabold leading-none tracking-tight sm:text-7xl">
          <span className="text-white">HOME TECHNOLOGY</span>
          <br />
          <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            EXPERTS
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-xl text-sm text-slate-300 sm:text-base">
          Integrated control system of nearly every aspect of your home or business.
        </p>

        {/* CTA gradient pill */}
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-10 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition-transform hover:scale-105"
        >
          Sign In
        </Link>

        {/* Indikator scroll kecil di bawah */}
        <p className="absolute bottom-6 text-[10px] uppercase tracking-widest text-slate-500">
          scroll
        </p>
      </div>
    </main>
  );
}
