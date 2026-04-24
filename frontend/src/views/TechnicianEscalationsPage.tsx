import { useState, useRef } from 'react';
import { useEscalations, useCreateEscalation, useEscalationSummary } from '../hooks/useEscalations';
import Modal from '../components/ui/Modal';
import type { Escalation, EscalationPriority, EscalationStatus } from '../types';

const PRIORITY_CONFIG: Record<EscalationPriority, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700', label: 'Critical' },
  high: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700', label: 'High' },
  medium: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700', label: 'Medium' },
  low: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-600', label: 'Low' },
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

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<EscalationPriority>('medium');
  const [taskId, setTaskId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setTaskId('');
    setFile(null);
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
        <p className="text-red-500 text-sm">Failed to load escalations.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Escalations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Issues you have reported and their current status</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
          aria-label="Create new escalation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Escalation
        </button>
      </div>

      {/* Summary cards */}
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

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter escalations by status">
        {(['all', 'open', 'in_review', 'resolved'] as const).map((status) => {
          const labels: Record<string, string> = { all: 'All', open: 'Open', in_review: 'In Review', resolved: 'Resolved' };
          return (
            <button
              key={status}
              role="tab"
              aria-selected={filterStatus === status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {labels[status]}
            </button>
          );
        })}
      </div>

      {/* Escalation cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No escalations found.</p>
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
      <Modal open={showForm} onClose={resetForm} title="New Escalation" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label htmlFor="new-esc-task" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task ID <span className="text-red-500">*</span>
            </label>
            <input
              id="new-esc-task"
              type="number"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="Enter the task ID"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="new-esc-title" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="new-esc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="new-esc-desc" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="new-esc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-esc-priority" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                id="new-esc-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as EscalationPriority)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="new-esc-file" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Attachment</label>
              <input
                id="new-esc-file"
                ref={fileRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim() || !taskId.trim() || createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Escalation'}
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-600">Failed to submit escalation. Please try again.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function EscalationCard({ escalation, expanded, onToggle }: { escalation: Escalation; expanded: boolean; onToggle: () => void }) {
  const pc = PRIORITY_CONFIG[escalation.priority];
  const sc = STATUS_CONFIG[escalation.status];
  const borderColor = PRIORITY_BORDER[escalation.priority];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${borderColor} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={expanded}
        aria-label={`${escalation.title} - ${sc.label}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{escalation.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {escalation.project_name && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{escalation.project_name}</span>
              )}
              {escalation.project_name && escalation.task_name && (
                <span className="text-gray-300 dark:text-gray-600">|</span>
              )}
              {escalation.task_name && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{escalation.task_name}</span>
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
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(escalation.created_at)}</p>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 whitespace-pre-wrap">{escalation.description}</p>
          </div>
          {escalation.file_name && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Attachment</p>
              <p className="text-sm text-blue-600">{escalation.file_name}</p>
            </div>
          )}
          {escalation.status === 'resolved' && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Resolution</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{escalation.resolution_notes ?? 'No notes provided'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Resolved by {escalation.resolver_name ?? 'Unknown'} on {escalation.resolved_at ? formatDateTime(escalation.resolved_at) : '--'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
