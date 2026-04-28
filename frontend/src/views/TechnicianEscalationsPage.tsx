import { useState, useRef } from 'react';
import {
  useEscalations,
  useCreateEscalation,
  useEscalationSummary,
  useEscalationUpdates,
  useAddEscalationUpdate,
  useRequestEscalationAction,
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
  in_review: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', label: 'Sedang Direview' },
  resolved:  { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-400', label: 'Selesai' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: 'Dibatalkan' },
};

const PRIORITY_BORDER: Record<EscalationPriority, string> = {
  critical: 'border-l-red-600',
  high:     'border-l-orange-600',
  medium:   'border-l-yellow-600',
  low:      'border-l-gray-500',
};

const ACTION_REQUEST_LABELS: Record<EscalationActionRequest, string> = {
  ganti_teknisi:       'Ganti Teknisi',
  ganti_material:      'Ganti Material/Alat',
  perpanjang_deadline: 'Perpanjang Deadline',
  mediasi_client:      'Mediasi ke Client',
  batalkan_eskalasi:   'Batalkan Eskalasi',
};

const ACTION_STATUS_CONFIG = {
  pending:  { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Menunggu Persetujuan' },
  approved: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Disetujui' },
  rejected: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Ditolak' },
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

export default function TechnicianEscalationsPage() {
  const { data: escalations, isLoading, isError, refetch } = useEscalations();
  const { data: summary } = useEscalationSummary();
  const createMutation = useCreateEscalation();

  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New escalation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<EscalationPriority>('medium');
  const [taskId, setTaskId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium'); setTaskId(''); setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !taskId.trim()) return;
    const formData = new FormData();
    formData.append('task_id', taskId.trim());
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('priority', priority);
    if (file) formData.append('file', file);
    createMutation.mutate(formData, { onSuccess: resetForm });
  };

  const filtered = (escalations ?? []).filter(
    (e) => filterStatus === 'all' || e.status === filterStatus
  );

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
        <p className="text-red-500 text-sm">Gagal memuat eskalasi.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Coba lagi</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Eskalasi Saya</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Masalah yang kamu laporkan dan statusnya saat ini</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Eskalasi Baru
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open', value: summary.open, cls: 'red' },
            { label: 'Direview', value: summary.in_review, cls: 'amber' },
            { label: 'Selesai', value: summary.resolved, cls: 'green' },
            { label: 'Total', value: summary.total ?? 0, cls: 'blue' },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`bg-${cls}-50 dark:bg-${cls}-900/30 border border-${cls}-200 dark:border-${cls}-800 rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-bold text-${cls}-600 dark:text-${cls}-400`}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'in_review', 'resolved', 'cancelled'] as const).map((s) => {
          const labels: Record<string, string> = { all: 'Semua', open: 'Open', in_review: 'Direview', resolved: 'Selesai', cancelled: 'Dibatalkan' };
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* Escalation cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada eskalasi ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((esc) => (
            <EscalationCard
              key={esc.id}
              escalation={esc}
              expanded={expanded === esc.id}
              onToggle={() => setExpanded(expanded === esc.id ? null : esc.id)}
            />
          ))}
        </div>
      )}

      {/* New Escalation Modal */}
      <Modal open={showForm} onClose={resetForm} title="Eskalasi Baru" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label htmlFor="new-esc-task" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task ID <span className="text-red-500">*</span>
            </label>
            <input
              id="new-esc-task" type="number" value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="Masukkan ID task"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="new-esc-title" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              id="new-esc-title" type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ringkasan masalah"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="new-esc-desc" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="new-esc-desc" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan masalah secara detail..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-esc-priority" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prioritas</label>
              <select
                id="new-esc-priority" value={priority}
                onChange={(e) => setPriority(e.target.value as EscalationPriority)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="new-esc-file" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lampiran</label>
              <input
                id="new-esc-file" ref={fileRef} type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim() || !taskId.trim() || createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Mengirim...' : 'Kirim Eskalasi'}
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-600">Gagal mengirim eskalasi. Coba lagi.</p>
          )}
        </div>
      </Modal>

    </div>
  );
}


function EscalationCard({
  escalation, expanded, onToggle,
}: {
  escalation: Escalation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pc = PRIORITY_CONFIG[escalation.priority];
  const sc = STATUS_CONFIG[escalation.status];
  const borderColor = PRIORITY_BORDER[escalation.priority];

  const [updateMsg, setUpdateMsg] = useState('');
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionType, setActionType] = useState<EscalationActionRequest>('perpanjang_deadline');
  const [actionNote, setActionNote] = useState('');

  const { data: updates } = useEscalationUpdates(expanded ? escalation.id : 0);
  const addUpdateMutation = useAddEscalationUpdate();
  const requestActionMutation = useRequestEscalationAction();

  const canAddUpdate = escalation.status !== 'resolved' && escalation.status !== 'cancelled';
  const canRequestAction = ['open', 'in_review'].includes(escalation.status) && escalation.action_request_status !== 'pending';

  const handleAddUpdate = () => {
    if (!updateMsg.trim()) return;
    addUpdateMutation.mutate({ id: escalation.id, message: updateMsg.trim() }, {
      onSuccess: () => setUpdateMsg(''),
    });
  };

  const handleRequestAction = () => {
    if (!actionNote.trim()) return;
    requestActionMutation.mutate(
      { id: escalation.id, action_request: actionType, action_request_note: actionNote.trim() },
      { onSuccess: () => { setShowActionForm(false); setActionNote(''); } }
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{escalation.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {escalation.project_name && <span className="text-xs text-gray-500 dark:text-gray-400">{escalation.project_name}</span>}
              {escalation.project_name && escalation.task_name && <span className="text-gray-300 dark:text-gray-600">|</span>}
              {escalation.task_name && <span className="text-xs text-gray-500 dark:text-gray-400">{escalation.task_name}</span>}
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

          {/* Attachment */}
          {escalation.file_name && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lampiran</p>
              <p className="text-sm text-blue-600">{escalation.file_name}</p>
            </div>
          )}

          {/* Action request badge */}
          {escalation.action_request && escalation.action_request_status && (
            <div className={`rounded-lg p-3 border ${ACTION_STATUS_CONFIG[escalation.action_request_status].bg} border-gray-200 dark:border-gray-700`}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Permintaan Tindakan</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {ACTION_REQUEST_LABELS[escalation.action_request]}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ACTION_STATUS_CONFIG[escalation.action_request_status].bg} ${ACTION_STATUS_CONFIG[escalation.action_request_status].text}`}>
                  {ACTION_STATUS_CONFIG[escalation.action_request_status].label}
                </span>
              </div>
              {escalation.action_request_note && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{escalation.action_request_note}</p>
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
          {(updates && updates.length > 0) && (
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

          {/* Add update textarea */}
          {canAddUpdate && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tambah Catatan</p>
              <textarea
                value={updateMsg}
                onChange={(e) => setUpdateMsg(e.target.value)}
                placeholder="Tulis update situasi terbaru..."
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
              {addUpdateMutation.isError && (
                <p className="text-xs text-red-600 mt-1">Gagal mengirim catatan.</p>
              )}
            </div>
          )}

          {/* Request action form */}
          {canRequestAction && (
            <div>
              {!showActionForm ? (
                <button
                  onClick={() => setShowActionForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Minta Tindakan Manager
                </button>
              ) : (
                <div className="border border-amber-200 dark:border-amber-700 rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20 space-y-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Minta Tindakan Manager</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Tindakan</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value as EscalationActionRequest)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {(Object.entries(ACTION_REQUEST_LABELS) as [EscalationActionRequest, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Catatan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Jelaskan kenapa tindakan ini diperlukan..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowActionForm(false); setActionNote(''); }} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50">
                      Batal
                    </button>
                    <button
                      onClick={handleRequestAction}
                      disabled={!actionNote.trim() || requestActionMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                      {requestActionMutation.isPending ? 'Mengirim...' : 'Kirim Permintaan'}
                    </button>
                  </div>
                  {requestActionMutation.isError && (
                    <p className="text-xs text-red-600">
                      {(requestActionMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal mengirim permintaan.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
