// Bilah navigasi (Gambar 5.25 / 5.26). Statis — link Indonesia.
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Peran } from '@/lib/auth';

const MENU_MANAJER = [
  { href: '/dashboard',    label: 'Dasbor'   },
  { href: '/projects',     label: 'Proyek'   },
  { href: '/escalations',  label: 'Eskalasi' },
];
const MENU_TEKNISI = [
  { href: '/dashboard',    label: 'Dasbor Performa' },
  { href: '/tasks',        label: 'Tugas Saya'      },
  { href: '/projects',     label: 'Proyek Saya'     },
  { href: '/escalations',  label: 'Eskalasi'        },
];

export function Sidebar({ peran, nama }: { peran: Peran; nama: string }) {
  const pathname = usePathname();
  const menu = peran === 'manager' ? MENU_MANAJER : MENU_TEKNISI;
  const labelPeran = peran === 'manager' ? 'Manajer' : 'Teknisi';
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-white">
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
            SHI
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Dasbor SHI</div>
            <div className="text-xs text-slate-500">Smart Home Inovasi</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {menu.map((m) => {
          const aktif = pathname === m.href || pathname.startsWith(m.href + '/');
          return (
            <Link
              key={m.href}
              href={m.href}
              className={
                'mb-1 block rounded-md px-3 py-2 text-sm ' +
                (aktif ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100')
              }
            >
              {m.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-3 text-sm">
        <div className="mb-2">
          <div className="font-medium">{nama}</div>
          <div className="text-xs text-slate-500">{labelPeran}</div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            formAction="/api/auth/logout"
            onClick={async (e) => {
              e.preventDefault();
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="w-full rounded-md border px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
