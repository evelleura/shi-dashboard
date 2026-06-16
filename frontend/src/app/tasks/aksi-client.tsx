'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AksiTugas({
  idTugas, aksi,
}: {
  idTugas: number;
  aksi: 'mulai' | 'info' | 'none';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (aksi === 'none') return null;
  if (aksi === 'info') return <span className="text-xs italic text-slate-500">Menunggu manajer</span>;
  return (
    <button
      className="btn-outline text-xs disabled:opacity-60"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/tasks/${idTugas}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'working_on' }),
        });
        router.refresh();
      }}
    >
      {loading ? '…' : 'Mulai Kerjakan'}
    </button>
  );
}
