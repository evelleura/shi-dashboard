// Lencana status proyek / tugas / eskalasi (Bahasa Indonesia).
type Status = string;

const MAP: Record<string, { kelas: string; label: string }> = {
  // proyek
  active:     { kelas: 'badge-green', label: 'Aktif' },
  completed:  { kelas: 'badge-gray',  label: 'Selesai' },
  'on-hold':  { kelas: 'badge-amber', label: 'Ditahan' },
  // fase
  survey:     { kelas: 'badge-amber', label: 'Survei' },
  execution:  { kelas: 'badge-green', label: 'Eksekusi' },
  // tugas
  to_do:      { kelas: 'badge-gray',  label: 'Belum Mulai' },
  working_on: { kelas: 'badge-amber', label: 'Dikerjakan' },
  done:       { kelas: 'badge-green', label: 'Selesai' },
  // eskalasi
  open:       { kelas: 'badge-red',   label: 'Terbuka' },
  ditangani:  { kelas: 'badge-amber', label: 'Ditangani' },
  closed:     { kelas: 'badge-green', label: 'Tutup' },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = MAP[status] ?? { kelas: 'badge-gray', label: status };
  return <span className={'badge ' + m.kelas}>{m.label}</span>;
}
