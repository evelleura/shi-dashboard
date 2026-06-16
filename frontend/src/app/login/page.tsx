// Halaman Masuk (Gambar 5.24) — split-screen: identitas kiri, formulir kanan.
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HalamanMasuk() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pesan, setPesan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setPesan(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setPesan(data.error ?? 'Gagal masuk');
        return;
      }
      router.push('/dashboard');
    } catch {
      setPesan('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="relative flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900 p-10 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <span className="text-2xl">⌂</span>
          </div>
          <h2 className="mb-3 text-3xl font-bold">Smart Home Inovasi</h2>
          <p className="mb-6 text-sm text-blue-100">
            Dasbor manajemen proyek dengan pemantauan real-time, Schedule Performance Index
            (SPI), dan Early Warning System untuk pengelolaan proyek smart home yang efisien.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1">SPI Real-time</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Papan Kanban</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Grafik Analitik</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Peringatan EWS</span>
          </div>
        </div>
        <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-blue-200">
          PT Smart Home Inovasi Yogyakarta
        </p>
      </div>

      <div className="flex items-center justify-center bg-white p-10">
        <form onSubmit={kirim} className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-bold">Selamat datang</h1>
          <p className="mb-6 text-sm text-slate-500">Masuk ke akun dasbor Anda.</p>

          {pesan && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {pesan}
            </div>
          )}

          <label className="label" htmlFor="email">Email</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="input mb-4" placeholder="nama@shi.co.id"
          />

          <label className="label" htmlFor="password">Kata Sandi</label>
          <input
            id="password" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="input mb-6" placeholder="Masukkan kata sandi"
          />

          <button
            type="submit" disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-blue-600 to-blue-700 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>

          <p className="mt-8 text-center text-xs text-slate-400">
            Tugas Akhir — Dian Putri Iswandi · 5220311118<br />
            Universitas Teknologi Yogyakarta — 2026
          </p>
        </form>
      </div>
    </main>
  );
}
