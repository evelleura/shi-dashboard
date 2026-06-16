// Lencana RAG (Red/Amber/Green) untuk kesehatan proyek.
import { labelKesehatan, type StatusKesehatan } from '@/lib/health';

export function HealthBadge({ status }: { status: StatusKesehatan | null | undefined }) {
  if (!status) return <span className="badge badge-gray">Belum Ada Data</span>;
  const kelas =
    status === 'green' ? 'badge-green' :
    status === 'amber' ? 'badge-amber' : 'badge-red';
  return <span className={'badge ' + kelas}>{labelKesehatan(status)}</span>;
}
