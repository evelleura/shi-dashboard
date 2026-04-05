import { useState } from 'react';
import { useEscalations, useEscalationSummary, useReviewEscalation, useResolveEscalation } from '../hooks/useEscalations';
import Modal from '../components/ui/Modal';
import type { Escalation, EscalationPriority, EscalationStatus } from '../types';

const PRIORITY_CONFIG: Record<EscalationPriority, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', label: 'Critical' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'High' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Medium' },
  low: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Low' },
};

const STATUS_CONFIG: Record<EscalationStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-red-100', text: 'text-red-700', label: 'Open' },
  in_review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Review' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
};

const PRIORITY_BORDER: Record<EscalationPriority, string> = {
  critical: 'border-l-red-600',
  high: 'border-l-orange-600',
  medium: 'border-l-yellow-600',
  low: 'border-l-gray-500',
};

const PRIORITY_ORDER: Record<EscalationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
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

  const handleReview = (id: number) => {
    reviewMutation.mutate(id);
  };

  const handleResolve = () => {
    if (!resolveModal || !resolutionNotes.trim()) return;
    resolveMutation.mutate(
      { id: resolveModal.id, resolution_notes: resolutionNotes.trim() },
      {
        onSuccess: () => {
          setResolveModal(null);
          setResolutionNotes('');
        },
      }
    );
  };

  const filtered = (escalations ?? [])
    .filter((e) => filterStatus === 'all' || e.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const pa = PRIORITY_ORDER[a.priority] ?? 2;
        const pb = PRIORITY_ORDER[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escalation Management</h1>
        <p className="text-sm text-gray-500">Review and resolve escalations from field technicians</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.open}</p>
            <p className="text-xs text-gray-500 mt-0.5">Open</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.in_review}</p>
            <p className="text-xs text-gray-500 mt-0.5">In Review</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.resolved}</p>
            <p className="text-xs text-gray-500 mt-0.5">Resolved</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.total ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
        </div>
      )}

      {/* Filters + Sort */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter escalations by status">
          {(['all', 'open', 'in_review', 'resolved'] as const).map((status) => {
            const labels: Record<string, string> = { all: 'All', open: 'Open', in_review: 'In Review', resolved: 'Resolved' };
            const counts: Record<string, number | undefined> = {
              all: summary?.total,
              open: summary?.open,
              in_review: summary?.in_review,
              resolved: summary?.resolved,
            };
            return (
              <button
                key={status}
                role="tab"
                aria-selected={filterStatus === status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {labels[status]} {counts[status] != null ? `(${counts[status]})` : ''}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-gray-500">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Priority</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>

      {/* Escalation list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-sm text-gray-500">No escalations found.</p>
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

      {/* Resolve Modal */}
      <Modal
        open={resolveModal !== null}
        onClose={() => setResolveModal(null)}
        title="Resolve Escalation"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {resolveModal && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{resolveModal.title}</p>
              <p className="text-xs text-gray-500 mt-1">{resolveModal.project_name} -- {resolveModal.task_name}</p>
            </div>
          )}
          <div>
            <label htmlFor="resolution-notes" className="block text-xs font-medium text-gray-700 mb-1">
              Resolution Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="resolution-notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this issue was resolved..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setResolveModal(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={!resolutionNotes.trim() || resolveMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resolveMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
            </button>
          </div>
          {resolveMutation.isError && (
            <p className="text-xs text-red-600">Failed to resolve escalation. Please try again.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function ManagerEscalationCard({
  escalation,
  expanded,
  onToggle,
  onReview,
  onResolve,
  isReviewing,
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

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}
        aria-label={`${escalation.title} - ${sc.label} - ${pc.label} priority`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{escalation.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">by {escalation.reporter_name ?? 'Unknown'}</span>
              {escalation.project_name && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">{escalation.project_name}</span>
                </>
              )}
              {escalation.task_name && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">{escalation.task_name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>
              {pc.label}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{formatDate(escalation.created_at)}</p>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{escalation.description}</p>
          </div>

          {escalation.file_name && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Attachment</p>
              <p className="text-sm text-blue-600">{escalation.file_name}</p>
            </div>
          )}

          {/* Resolution details (for resolved escalations) */}
          {escalation.status === 'resolved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-700 mb-1">Resolution</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{escalation.resolution_notes ?? 'No notes provided'}</p>
              <p className="text-xs text-gray-400 mt-2">
                Resolved by {escalation.resolver_name ?? 'Unknown'} on {escalation.resolved_at ? formatDateTime(escalation.resolved_at) : '--'}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {escalation.status === 'open' && (
              <button
                onClick={() => onReview(escalation.id)}
                disabled={isReviewing}
                className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
              >
                {isReviewing ? 'Reviewing...' : 'Start Review'}
              </button>
            )}
            {escalation.status === 'in_review' && (
              <button
                onClick={() => onResolve(escalation)}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
