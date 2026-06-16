'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function FormProyekBaru({ klien }: { klien: { id_klien: number; nama_klien: string }[] }) {
  const router = useRouter();
  const [state, setState] = useState({
    nama_proyek: '', id_klien: '', start_date: '', end_date: '',
    phase: 'survey', category: 'instalasi', description: '', project_value: '',
  });
  const [pesan, setPesan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof state>(k: K, v: string) {
    setState((s) => ({ ...s, [k]: v }));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setPesan(null);
    const r = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...state,
        id_klien: state.id_klien ? Number(state.id_klien) : null,
        project_value: state.project_value ? Number(state.project_value) : 0,
      }),
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setPesan(data.error ?? 'Gagal menyimpan'); return; }
    router.push(`/projects/${data.id_proyek}`);
  }

  return (
    <form onSubmit={kirim} className="card max-w-2xl space-y-4">
      {pesan && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pesan}</div>
      )}
      <div>
        <label className="label">Nama Proyek</label>
        <input className="input" required value={state.nama_proyek}
          onChange={(e) => set('nama_proyek', e.target.value)} placeholder="Mis. Pemasangan Smart Lock Perumahan X" />
      </div>
      <div>
        <label className="label">Klien</label>
        <select className="input" value={state.id_klien} onChange={(e) => set('id_klien', e.target.value)}>
          <option value="">— Pilih klien —</option>
          {klien.map((k) => (
            <option key={k.id_klien} value={k.id_klien}>{k.nama_klien}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tanggal Mulai</label>
          <input className="input" type="date" required value={state.start_date}
            onChange={(e) => set('start_date', e.target.value)} />
        </div>
        <div>
          <label className="label">Tanggal Akhir</label>
          <input className="input" type="date" required value={state.end_date}
            onChange={(e) => set('end_date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fase</label>
          <select className="input" value={state.phase} onChange={(e) => set('phase', e.target.value)}>
            <option value="survey">Survei</option>
            <option value="execution">Eksekusi</option>
          </select>
        </div>
        <div>
          <label className="label">Kategori</label>
          <select className="input" value={state.category} onChange={(e) => set('category', e.target.value)}>
            <option value="instalasi">Instalasi</option>
            <option value="maintenance">Pemeliharaan</option>
            <option value="monitoring">Pemantauan</option>
            <option value="security">Keamanan</option>
            <option value="networking">Jaringan</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Nilai Proyek (Rp)</label>
        <input className="input" type="number" min="0" value={state.project_value}
          onChange={(e) => set('project_value', e.target.value)} />
      </div>
      <div>
        <label className="label">Deskripsi</label>
        <textarea className="input min-h-[80px]" value={state.description}
          onChange={(e) => set('description', e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
        {loading ? 'Menyimpan…' : 'Simpan Proyek'}
      </button>
    </form>
  );
}
