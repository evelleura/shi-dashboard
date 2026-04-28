import { useState } from 'react';
import {
  useEscalations,
  useEscalationSummary,
  useReviewEscalation,
  useResolveEscalation,
  useEscalationUpdates,
  useAddEscalationUpdate,
  useRespondEscalationAction,
} from '../hooks/useEscalations';
import Modal from '../components/ui/Modal';
import type { Escalation, EscalationPriority, EscalationStatus, EscalationActionRequest } from '../types';

const PRIORITY_CONFIG: Record<EscalationPriority, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Critical' },
  high:     { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'High' },
  medium:   { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Medium' },
  low:      { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'Low' },
};

const STATUS_CONFIG: Record<EscalationStatus, { bg: string; text: string; label: string }> = {
  open:      { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', label: 'Open' },
  in_review: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', label: 'In Review' },
  resolved:  { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-400', label: 'Resolved' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: 'Dibatalkan' },
};

const PRIORITY_BORDER: Record<EscalationPriority, string> = {
  critical: 'border-l-red-600',
  high:     'border-l-orange-600',
  medium:   'border-l-yellow-600',
  low:      'border-l-gray-500',
};

const PRIORITY_ORDER: Record<EscalationPriority, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

const ACTION_REQUEST_LABELS: Record<EscalationActionRequest, string> = {
  ganti_teknisi:       'Ganti Teknisi',
  ganti_material:      'Ganti Material/Alat',
  perpanjang_deadline: 'Perpanjang Deadline',
  mediasi_client:      'Mediasi ke Client',
  batalkan_eskalasi:   'Batalkan Eskalasi',
};

const ACTION_STATUS_CONFIG = {
  pending:  { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-400', label: 'Menunggu Persetujuan' },
  approved: { bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-700', text: 'text-green-700 dark:text-green-400', label: 'Disetujui' },
  rejected: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-700', text: 'text-red-700 dark:text-red-400', label: 'Ditolak' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

type SortField = 'priority' | 'date';

export default function EscalationsPage() {
  const { data: escalations, isLoading, isError, refetch } = useEscalations();
  const { data: summary } = useEscalationSummary();
  const reviewMutation = useReviewEscalation();
  const resolveMutation = useResolveEscalation();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [resolveModal, setResolveModal] = useState<Escalation | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleReview = (id: number) => reviewMutation.mutate(id);

  const handleResolve = () => {
    if (!resolveModal || !resolutionNotes.trim()) return;
    resolveMutation.mutate(
      { id: resolveModal.id, resolution_notes: resolutionNotes.trim() },
      { onSuccess: () => { setResolveModal(null); setResolutionNotes(''); } }
    );
  };

  const filtered = (escalations ?? [])
    .filter((e) => filterStatus === 'all' || e.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const pa = PRIORITY_ORDER[a.priority] ?? 2;
        const pb = PRIORITY_ORDER[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Failed to load escalations.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manajemen Eskalasi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Review dan selesaikan eskalasi dari teknisi lapangan</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.open}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Open</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.in_review}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">In Review</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.resolved}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Resolved</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.total ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'open', 'in_review', 'resolved', 'cancelled'] as const).map((status) => {
            const labels: Record<string, string> = { all: 'Semua', open: 'Open', in_review: 'In Review', resolved: 'Resolved', cancelled: 'Dibatalkan' };
            const counts: Record<string, number | undefined> = {
              all: summary?.total, open: summary?.open, in_review: summary?.in_review, resolved: summary?.resolved, cancelled: undefined,
            };
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {labels[status]} {counts[status] != null ? `(${counts[status]})` : ''}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-gray-500 dark:text-gray-400">Urutkan:</label>
          <select
            id="sort-select" value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Prioritas</option>
            <option value="date">Tanggal</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Tidak ada eskalasi ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((esc) => (
            <ManagerEscalationCard
              key={esc.id}
              escalation={esc}
              expanded={expandedId === esc.id}
              onToggle={() => setExpandedId(expandedId === esc.id ? null : esc.id)}
              onReview={handleReview}
              onResolve={(e) => { setResolveModal(e); setResolutionNotes(''); }}
              isReviewing={reviewMutation.isPending}
            />
          ))}
        </div>
      )}

      <Modal open={resolveModal !== null} onClose={() => setResolveModal(null)} title="Selesaikan Eskalasi" maxWidth="max-w-md">
        <div className="space-y-4">
          {resolveModal && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{resolveModal.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{resolveModal.project_name} — {resolveModal.task_name}</p>
            </div>
          )}
          <div>
            <label htmlFor="resolution-notes" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Catatan Resolusi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="resolution-notes" value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Jelaskan bagaimana masalah ini diselesaikan..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setResolveModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50">
              Batal
            </button>
            <button
              onClick={handleResolve}
              disabled={!resolutionNotes.trim() || resolveMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {resolveMutation.isPending ? 'Menyimpan...' : 'Tandai Selesai'}
            </button>
          </div>
          {resolveMutation.isError && (
            <p className="text-xs text-red-600">Gagal menyelesaikan eskalasi. Coba lagi.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function ManagerEscalationCard({
  escalation, expanded, onToggle, onReview, onResolve, isReviewing,
}: {
  escalation: Escalation;
  expanded: boolean;
  onToggle: () => void;
  onReview: (id: number) => void;
  onResolve: (esc: Escalation) => void;
  isReviewing: boolean;
}) {
  const pc = PRIORITY_CONFIG[escalation.priority];
  const sc = STATUS_CONFIG[escalation.status];
  const borderColor = PRIORITY_BORDER[escalation.priority];

  const [updateMsg, setUpdateMsg] = useState('');
  const [respondNote, setRespondNote] = useState('');
  const [showRespondForm, setShowRespondForm] = useState(false);
  const [respondAction, setRespondAction] = useState<'approved' | 'rejected'>('approved');

  const { data: updates } = useEscalationUpdates(expanded ? escalation.id : 0);
  const addUpdateMutation = useAddEscalationUpdate();
  const respondActionMutation = useRespondEscalationAction();

  const hasPendingRequest = escalation.action_request_status === 'pending';

  const handleAddUpdate = () => {
    if (!updateMsg.trim()) return;
    addUpdateMutation.mutate({ id: escalation.id, message: updateMsg.trim() }, {
      onSuccess: () => setUpdateMsg(''),
    });
  };

  const handleRespondAction = (decision: 'approved' | 'rejected') => {
    if (!respondNote.trim()) return;
    respondActionMutation.mutate(
      { id: escalation.id, status: decision, response_note: respondNote.trim() },
      { onSuccess: () => { setShowRespondForm(false); setRespondNote(''); } }
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${borderColor} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{escalation.title}</h3>
              {hasPendingRequest && (
                <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                  Ada permintaan tindakan
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">oleh {escalation.reporter_name ?? 'Unknown'}</span>
              {escalation.project_name && (
                <><span className="text-gray-300 dark:text-gray-600">|</span><span className="text-xs text-gray-500 dark:text-gray-400">{escalation.project_name}</span></>
              )}
              {escalation.task_name && (
                <><span className="text-gray-300 dark:text-gray-600">|</span><span className="text-xs text-gray-500 dark:text-gray-400">{escalation.task_name}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{pc.label}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(escalation.created_at)}</p>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-4">
          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Deskripsi</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 whitespace-pre-wrap">{escalation.description}</p>
          </div>

          {escalation.file_name && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lampiran</p>
              <p className="text-sm text-blue-600">{escalation.file_name}</p>
            </div>
          )}

          {/* Action request section — pending */}
          {escalation.action_request && escalation.action_request_status && (
            <div className={`rounded-lg p-3 border ${ACTION_STATUS_CONFIG[escalation.action_request_status].bg} ${ACTION_STATUS_CONFIG[escalation.action_request_status].border}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Permintaan Tindakan: {ACTION_REQUEST_LABELS[escalation.action_request as EscalationActionRequest]}
                </p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ACTION_STATUS_CONFIG[escalation.action_request_status].bg} ${ACTION_STATUS_CONFIG[escalation.action_request_status].text}`}>
                  {ACTION_STATUS_CONFIG[escalation.action_request_status].label}
                </span>
              </div>
              {escalation.action_request_note && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{escalation.action_request_note}</p>
              )}
              {hasPendingRequest && (
                !showRespondForm ? (
                  <button
                    onClick={() => setShowRespondForm(true)}
                    className="text-xs font-medium text-amber-700 dark:text-amber-400 underline hover:no-underline"
                  >
                    Tanggapi permintaan ini →
                  </button>
                ) : (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={respondNote}
                      onChange={(e) => setRespondNote(e.target.value)}
                      placeholder="Tulis catatan tanggapan..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2 justify-end flex-wrap">
                      <button
                        onClick={() => { setShowRespondForm(false); setRespondNote(''); setRespondAction('approved'); }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => { setRespondAction('rejected'); handleRespondAction('rejected'); }}
                        disabled={!respondNote.trim() || respondActionMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        {respondActionMutation.isPending && respondAction === 'rejected' ? 'Menyimpan...' : 'Tolak'}
                      </button>
                      <button
                        onClick={() => { setRespondAction('approved'); handleRespondAction('approved'); }}
                        disabled={!respondNote.trim() || respondActionMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {respondActionMutation.isPending && respondAction === 'approved' ? 'Menyimpan...' : 'Setujui'}
                      </button>
                    </div>
                    {respondActionMutation.isError && (
                      <p className="text-xs text-red-600">
                        {(respondActionMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan tanggapan.'}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Resolution */}
          {escalation.status === 'resolved' && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Resolusi</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{escalation.resolution_notes ?? 'Tidak ada catatan'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Diselesaikan oleh {escalation.resolver_name ?? 'Unknown'} pada {escalation.resolved_at ? formatDateTime(escalation.resolved_at) : '--'}
              </p>
            </div>
          )}

          {/* Update thread */}
          {updates && updates.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Riwayat Catatan</p>
              <div className="space-y-2">
                {updates.map((u) => (
                  <div key={u.id} className="flex gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center">
                      {(u.author_name ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{u.author_name ?? 'Unknown'}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDateTime(u.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{u.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manager add update */}
          {escalation.status !== 'resolved' && escalation.status !== 'cancelled' && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tambah Catatan</p>
              <textarea
                value={updateMsg}
                onChange={(e) => setUpdateMsg(e.target.value)}
                placeholder="Tulis catatan atau update untuk teknisi..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  onClick={handleAddUpdate}
                  disabled={!updateMsg.trim() || addUpdateMutation.isPending}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addUpdateMutation.isPending ? 'Mengirim...' : 'Kirim Catatan'}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {escalation.status !== 'cancelled' && (
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
              {escalation.status === 'open' && (
                <button
                  onClick={() => onReview(escalation.id)}
                  disabled={isReviewing}
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                >
                  {isReviewing ? 'Memproses...' : 'Mulai Review'}
                </button>
              )}
              {escalation.status === 'in_review' && (
                <button
                  onClick={() => onResolve(escalation)}
                  className="px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Selesaikan
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
