// Tata letak umum halaman terlindungi: bilah navigasi + isi.
import { redirect } from 'next/navigation';
import { getSesi } from '@/lib/session';
import { Sidebar } from './Sidebar';
import type { PenggunaSesi } from '@/lib/auth';

export async function Shell({
  children,
  judul,
}: {
  children: (u: PenggunaSesi) => React.ReactNode;
  judul: string;
}) {
  const u = await getSesi();
  if (!u) redirect('/login');
  return (
    <div className="flex min-h-screen">
      <Sidebar peran={u.role} nama={u.nama} />
      <main className="flex-1 overflow-x-hidden">
        <header className="border-b bg-white px-8 py-4">
          <h1 className="text-xl font-semibold">{judul}</h1>
        </header>
        <div className="p-6">{children(u)}</div>
      </main>
    </div>
  );
}
