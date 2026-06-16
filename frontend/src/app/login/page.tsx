// Halaman Login (Gambar 5.24 Naskah TA Final 4) — pola split-screen:
// kiri menampilkan identitas Smart Home Inovasi dengan gradien biru,
// kanan menampilkan formulir Sign In dengan judul "Welcome back".
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function LogoBulat() {
  // Logo bundar dengan ikon rumah / IoT sesuai screenshot.
  return (
    <div className="relative">
      <div className="absolute inset-0 scale-150 rounded-full bg-white/15 blur-3xl" />
      <div className="relative grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
        <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9.5z" />
        </svg>
      </div>
    </div>
  );
}

function Particle({ delay, x, y, size, ring }: { delay: number; x: number; y: number; size: number; ring?: boolean }) {
  return (
    <div
      className={'absolute rounded-full ' + (ring ? 'border border-white/15' : 'bg-white/10 blur-xl')}
      style={{
        width: size, height: size,
        left: `${x}%`, top: `${y}%`,
        animation: `pulse ${3 + delay}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

function IkonMail() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IkonGembok() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v3m-6-3a2 2 0 012-2h8a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7zm2 0V7a4 4 0 118 0v4" />
    </svg>
  );
}

export default function HalamanMasuk() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setPesan(null); setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) { setPesan(data.error ?? 'Email atau kata sandi salah.'); return; }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setPesan('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* ─── Panel kiri — identitas Smart Home Inovasi ─────────────── */}
      <aside className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white lg:flex lg:w-[55%]">
        <Particle delay={0}   x={10} y={18} size={90} />
        <Particle delay={1.2} x={75} y={12} size={130} ring />
        <Particle delay={0.6} x={60} y={68} size={60} ring />
        <Particle delay={1.8} x={18} y={78} size={110} />
        <Particle delay={0.4} x={86} y={55} size={50} ring />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8 flex justify-center"><LogoBulat /></div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Smart Home
            <br />
            <span className="text-blue-200">Inovasi</span>
          </h1>

          <p className="mb-8 text-sm leading-relaxed text-blue-100">
            Project management dashboard with real-time monitoring,
            Schedule Performance Index (SPI), and Early Warning System
            for efficient smart home project execution.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {['Real-time SPI', 'Kanban Boards', 'Analytics', 'Alerts'].map((t) => (
              <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="absolute bottom-5 left-0 right-0 text-center text-[11px] text-blue-200/70">
          © PT Smart Home Inovasi — Yogyakarta
        </p>
      </aside>

      {/* ─── Panel kanan — form Sign In ─────────────────────────────── */}
      <section className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
        <form onSubmit={kirim} className="w-full max-w-md">
          {/* Brand untuk mobile (panel kiri tersembunyi di <lg) */}
          <div className="mb-6 flex flex-col items-center lg:hidden">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9.5z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">Smart Home Inovasi</p>
          </div>

          <div className="mb-7">
            <h2 className="mb-1 text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to your dashboard account</p>
          </div>

          {pesan && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {pesan}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><IkonMail /></span>
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><IkonGembok /></span>
              <input
                id="password" type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {showPwd ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L3 3m6.88 6.88L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-800 hover:shadow-lg disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-snug text-slate-600 shadow-sm">
            <p className="mb-1 font-semibold uppercase tracking-wide text-slate-700">Demo accounts</p>
            <p>manajer@shi.co.id / password123 — Manajer</p>
            <p>roni@shi.co.id / password123 — Teknisi</p>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Tugas Akhir — Dian Putri Iswandi · 5220311118 · Universitas Teknologi Yogyakarta 2026
          </p>
        </form>
      </section>
    </main>
  );
}
