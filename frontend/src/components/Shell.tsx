// Tata letak halaman terlindungi mengikuti wireframe PDF:
// Top bar gelap "PT Smart Home Inovasi" — sebelah kanan: "Peran: [Nama] | Keluar".
// Sidebar putih di kiri, konten utama berlatar abu sangat muda.
import { redirect } from 'next/navigation';
import { getSesi } from '@/lib/session';
import { Sidebar } from './Sidebar';
import { TopbarKeluar } from './TopbarKeluar';
import type { PenggunaSesi } from '@/lib/auth';

export async function Shell({
  children,
  judul,
  subjudul,
  aksi,
}: {
  children: (u: PenggunaSesi) => React.ReactNode;
  judul: string;
  subjudul?: string;
  aksi?: React.ReactNode;
}) {
  const u = await getSesi();
  if (!u) redirect('/login');
  const labelPeran = u.role === 'manager' ? 'Manajer' : 'Teknisi';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar mengikuti wireframe: latar gelap + judul kiri + identitas kanan */}
      <header className="flex h-12 items-center justify-between border-b border-slate-900 bg-slate-800 px-5 text-sm text-white">
        <div className="font-semibold tracking-wide">PT Smart Home Inovasi</div>
        <div className="flex items-center gap-3">
          <span className="hidden text-slate-200 sm:inline">
            {labelPeran}: <span className="font-semibold text-white">{u.nama}</span>
          </span>
          <span className="text-slate-500">|</span>
          <TopbarKeluar />
        </div>
      </header>

      {/* Body: sidebar + konten */}
      <div className="flex flex-1">
        <Sidebar peran={u.role} nama={u.nama} />
        <main className="flex-1 overflow-x-hidden">
          {/* Header halaman */}
          <div className="border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="ml-10 lg:ml-0">
                <h1 className="text-lg font-bold text-slate-900">{judul}</h1>
                {subjudul && <p className="mt-0.5 text-xs text-slate-500">{subjudul}</p>}
              </div>
              {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
            </div>
          </div>

          {/* Isi */}
          <div className="p-6 lg:p-8">{children(u)}</div>
        </main>
      </div>
    </div>
  );
}
