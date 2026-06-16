'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function FormApproveTombol({ idProyek }: { idProyek: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/projects/${idProyek}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approveSurvey: true }),
        });
        router.refresh();
        setLoading(false);
      }}
      className="btn-primary disabled:opacity-60"
    >
      {loading ? 'Memproses…' : 'Setujui Hasil Survei'}
    </button>
  );
}
