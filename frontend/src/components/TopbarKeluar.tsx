// Tombol Keluar yang ada di top bar (klien-side karena perlu fetch + replace).
'use client';
import { useRouter } from 'next/navigation';

export function TopbarKeluar() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/login');
      }}
      className="rounded px-2 py-1 text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
    >
      Keluar
    </button>
  );
}
