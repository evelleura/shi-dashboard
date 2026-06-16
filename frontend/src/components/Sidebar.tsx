// Sidebar navigasi — gaya wireframe PDF: latar putih, item aktif diberi
// penanda ■ di kiri (Gambar 4.18, 4.20, 4.21, 4.22, 4.23).
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Peran } from '@/lib/auth';

interface Item { href: string; label: string }

export function Sidebar({ peran }: { peran: Peran; nama: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items: Item[] = peran === 'manager'
    ? [
        { href: '/dashboard',   label: 'Dashboard' },
        { href: '/projects',    label: 'Proyek' },
        { href: '/clients',     label: 'Klien' },
        { href: '/schedule',    label: 'Jadwal' },
        { href: '/reports',     label: 'Laporan' },
        { href: '/settings',    label: 'Pengaturan' },
      ]
    : [
        { href: '/dashboard',   label: 'Dashboard' },
        { href: '/tasks',       label: 'Tugas Saya' },
        { href: '/reports',     label: 'Daily Report' },
        { href: '/profile',     label: 'Profil' },
      ];

  async function keluar() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <>
      {/* Toggle untuk mobile */}
      <button
        type="button"
        className="fixed left-3 top-3 z-50 rounded-md border border-slate-300 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label="Buka menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside
        className={
          'fixed inset-y-0 left-0 z-40 flex w-52 transform flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ' +
          (open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
        }
      >
        {/* Label MENU di atas */}
        <div className="px-5 pt-6 pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          MENU
        </div>

        {/* Daftar item */}
        <nav className="flex-1 px-2">
          {items.map((it) => {
            const aktif = pathname === it.href || pathname.startsWith(it.href + '/');
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ' +
                  (aktif
                    ? 'bg-slate-100 font-semibold text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50')
                }
              >
                {/* Penanda ■ untuk item aktif (matching wireframe PDF) */}
                <span className={'inline-block h-2.5 w-2.5 ' + (aktif ? 'bg-slate-900' : 'bg-transparent')} />
                {it.label}
              </Link>
            );
          })}
        </nav>

        {/* Keluar di paling bawah */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={keluar}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <span className="inline-block h-2.5 w-2.5" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
