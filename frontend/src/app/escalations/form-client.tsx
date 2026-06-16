'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function FormEskalasi({ tugas }: { tugas: { id_tugas: number; label: string }[] }) {
  const router = useRouter();
  const [state, setState] = useState({ id_tugas: '', title: '', description: '', priority: 'medium' });
  const [pesan, setPesan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setPesan(null);
    const r = await fetch('/api/escalations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...state, id_tugas: Number(state.id_tugas) }),
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setPesan(data.error ?? 'Gagal mengirim eskalasi'); return; }
    setState({ id_tugas: '', title: '', description: '', priority: 'medium' });
    router.refresh();
  }

  return (
    <form onSubmit={kirim} className="card max-w-2xl space-y-3">
      <h2 className="text-base font-semibold">Ajukan Eskalasi / Kendala</h2>
      {pesan && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pesan}</div>
      )}
      <div>
        <label className="label">Tugas Terkait</label>
        <select className="input" required value={state.id_tugas}
          onChange={(e) => setState((s) => ({ ...s, id_tugas: e.target.value }))}>
          <option value="">— Pilih tugas —</option>
          {tugas.map((t) => <option key={t.id_tugas} value={t.id_tugas}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Judul Singkat</label>
        <input className="input" required value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} />
      </div>
      <div>
        <label className="label">Deskripsi Kendala</label>
        <textarea className="input min-h-[80px]" required value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))} />
      </div>
      <div>
        <label className="label">Prioritas</label>
        <select className="input" value={state.priority}
          onChange={(e) => setState((s) => ({ ...s, priority: e.target.value }))}>
          <option value="low">Rendah</option>
          <option value="medium">Sedang</option>
          <option value="high">Tinggi</option>
        </select>
      </div>
      <button className="btn-primary disabled:opacity-60" disabled={loading}>
        {loading ? 'Mengirim…' : 'Kirim Eskalasi'}
      </button>
    </form>
  );
}

export function TombolTangani({
  idEskalasi, sudahDitangani,
}: {
  idEskalasi: number;
  sudahDitangani: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          const instruksi = window.prompt('Tulis instruksi penanganan untuk teknisi:') ?? '';
          if (!instruksi.trim()) return;
          setLoading(true);
          await fetch(`/api/escalations/${idEskalasi}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instruksi }),
          });
          router.refresh();
          setLoading(false);
        }}
        className="btn-outline text-xs"
      >
        Kirim Instruksi
      </button>
      {sudahDitangani && (
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await fetch(`/api/escalations/${idEskalasi}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tutup: true }),
            });
            router.refresh();
            setLoading(false);
          }}
          className="btn-outline text-xs"
        >
          Tutup
        </button>
      )}
    </div>
  );
}
