// Papan Kanban tugas: tiga kolom Belum Mulai / Dikerjakan / Selesai.
// Tanpa drag-and-drop — gunakan tombol agar mudah dijelaskan akademik.
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'to_do' | 'working_on' | 'done';

interface Tugas {
  id_tugas: number;
  nama_tugas: string;
  status: Status;
  due_date: string | null;
  nama_teknisi: string | null;
}

const KOLOM: { kunci: Status; judul: string; warna: string }[] = [
  { kunci: 'to_do',      judul: 'Belum Mulai', warna: 'bg-slate-50 border-slate-200' },
  { kunci: 'working_on', judul: 'Dikerjakan',  warna: 'bg-amber-50 border-amber-200' },
  { kunci: 'done',       judul: 'Selesai',     warna: 'bg-green-50 border-green-200' },
];

export function KanbanTugas({
  tugas, peran, idUserSesi, idProyek,
}: {
  tugas: Tugas[];
  peran: 'manager' | 'technician';
  idUserSesi: number;
  idProyek: number;
}) {
  const router = useRouter();
  const [pesan, setPesan] = useState<string | null>(null);

  async function ubahStatus(idTugas: number, status: Status) {
    setPesan(null);
    const r = await fetch(`/api/tasks/${idTugas}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setPesan(d.error ?? 'Gagal mengubah status');
      return;
    }
    router.refresh();
  }

  function aksiTeknisi(t: Tugas) {
    if (t.id_tugas == null) return null;
    if (t.status === 'to_do') {
      return (
        <button className="btn-outline text-xs" onClick={() => ubahStatus(t.id_tugas, 'working_on')}>
          Mulai Kerjakan
        </button>
      );
    }
    if (t.status === 'working_on') {
      return (
        <span className="text-xs italic text-slate-500">
          Menunggu peninjauan manajer (Review Gate)
        </span>
      );
    }
    return null;
  }

  function aksiManajer(t: Tugas) {
    if (t.status === 'working_on') {
      return (
        <button className="btn-primary text-xs" onClick={() => ubahStatus(t.id_tugas, 'done')}>
          Setujui & Selesaikan
        </button>
      );
    }
    if (t.status === 'done') {
      return (
        <button className="btn-outline text-xs" onClick={() => ubahStatus(t.id_tugas, 'working_on')}>
          Kembalikan ke Dikerjakan
        </button>
      );
    }
    return null;
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-base font-semibold">Papan Kanban Tugas — Proyek #{idProyek}</h2>
      {pesan && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pesan}</div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KOLOM.map((kol) => (
          <div key={kol.kunci} className={'rounded-lg border p-3 ' + kol.warna}>
            <div className="mb-2 text-sm font-semibold">{kol.judul}</div>
            <div className="space-y-2">
              {tugas.filter((t) => t.status === kol.kunci).map((t) => {
                const milikSaya = peran === 'technician' && /* heuristik */ true; // server otorisasi
                const aksi = peran === 'manager'
                  ? aksiManajer(t)
                  : milikSaya ? aksiTeknisi(t) : null;
                void idUserSesi;
                return (
                  <div key={t.id_tugas} className="rounded border bg-white p-3 shadow-sm">
                    <div className="text-sm font-medium">{t.nama_tugas}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {t.nama_teknisi ?? 'Belum ditugaskan'} ·{' '}
                      {t.due_date ? `Tenggat ${t.due_date.toString().slice(0, 10)}` : 'tanpa tenggat'}
                    </div>
                    {aksi && <div className="mt-2">{aksi}</div>}
                  </div>
                );
              })}
              {tugas.filter((t) => t.status === kol.kunci).length === 0 && (
                <p className="text-xs text-slate-400">Belum ada tugas.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
