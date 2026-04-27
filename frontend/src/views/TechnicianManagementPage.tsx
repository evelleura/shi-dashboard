import { useState, useMemo, useEffect } from 'react';
import { useTechnicianList, useTechnicianDetail, useCreateUser, useUpdateUser, useDeleteUser, useResetPassword } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import DataTable, { type Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { TaskStatusBadge } from '../components/tasks/TaskStatusSelect';
import type { UserRole, TaskStatus } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface TechnicianRow {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  project_count: number;
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  overdue_tasks: number;
  total_time_seconds: number;
  evidence_count: number;
}

interface TechnicianDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  evidence_count: number;
  projects: {
    id: number;
    project_code: string;
    name: string;
    status: string;
    phase: string;
    start_date: string;
    end_date: string;
    client_name?: string;
    spi_value: number | null;
    health_status: string | null;
    my_tasks: number;
    my_completed: number;
  }[];
  task_stats: {
    total: number;
    to_do: number;
    in_progress: number;
    working_on_it: number;
    review: number;
    done: number;
    overdue: number;
    total_time_seconds: number;
  };
  recent_tasks: {
    id: number;
    name: string;
    status: TaskStatus;
    due_date: string | null;
    time_spent_seconds: number;
    is_tracking: boolean;
    project_name: string;
    updated_at: string;
  }[];
}

function formatTime(seconds: number): string {
  if (seconds === 0) return '0h';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function HealthBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">--</span>;
  const colors: Record<string, string> = {
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

const INPUT_CLASS =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const LABEL_CLASS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

// ── Component ─────────────────────────────────────────────────────────────────

export default function TechnicianManagementPage({ defaultDetailId }: { defaultDetailId?: number } = {}) {
  const { user: me } = useAuth();
  const { data: technicians = [], isLoading, isError } = useTechnicianList();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resetMutation = useResetPassword();

  // State
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (defaultDetailId && !isNaN(defaultDetailId)) setSelectedId(defaultDetailId);
  }, [defaultDetailId]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTech, setEditTech] = useState<TechnicianRow | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetId, setResetTargetId] = useState<number | null>(null);
  const [resetTargetName, setResetTargetName] = useState('');

  // Forms
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [newPassword, setNewPassword] = useState('');

  // Errors
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [resetError, setResetError] = useState('');

  // Detail query
  const { data: detail, isLoading: detailLoading } = useTechnicianDetail(selectedId);
  const techDetail = detail as TechnicianDetail | undefined;

  // Filtered list
  const filtered = useMemo(() => {
    if (!search.trim()) return technicians;
    const q = search.toLowerCase();
    return technicians.filter(
      (t: TechnicianRow) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    );
  }, [technicians, search]);

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns: Column<TechnicianRow>[] = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        defaultHidden: true,
        render: (t) => <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{t.id}</span>,
        sortValue: (t) => t.id,
        exportValue: (t) => t.id,
      },
      {
        key: 'name',
        label: 'Name',
        render: (t) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {t.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.email}</p>
            </div>
          </div>
        ),
        sortValue: (t) => t.name.toLowerCase(),
        exportValue: (t) => t.name,
      },
      {
        key: 'project_count',
        label: 'Projects',
        render: (t) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t.project_count}</span>
        ),
        sortValue: (t) => t.project_count,
        exportValue: (t) => String(t.project_count),
      },
      {
        key: 'total_tasks',
        label: 'Tasks',
        render: (t) => (
          <div className="text-sm">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{t.completed_tasks}/{t.total_tasks}</span>
            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">done</span>
          </div>
        ),
        sortValue: (t) => t.total_tasks,
        exportValue: (t) => `${t.completed_tasks}/${t.total_tasks}`,
      },
      {
        key: 'active_tasks',
        label: 'Active',
        render: (t) => (
          <span className={`text-sm font-medium ${t.active_tasks > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
            {t.active_tasks}
          </span>
        ),
        sortValue: (t) => t.active_tasks,
        exportValue: (t) => String(t.active_tasks),
      },
      {
        key: 'overdue_tasks',
        label: 'Overdue',
        render: (t) => (
          <span className={`text-sm font-medium ${t.overdue_tasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
            {t.overdue_tasks}
          </span>
        ),
        sortValue: (t) => t.overdue_tasks,
        exportValue: (t) => String(t.overdue_tasks),
      },
      {
        key: 'total_time_seconds',
        label: 'Time Logged',
        render: (t) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatTime(t.total_time_seconds)}</span>
        ),
        sortValue: (t) => t.total_time_seconds,
        exportValue: (t) => formatTime(t.total_time_seconds),
      },
      {
        key: 'evidence_count',
        label: 'Evidence',
        render: (t) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{t.evidence_count}</span>
        ),
        sortValue: (t) => t.evidence_count,
        exportValue: (t) => String(t.evidence_count),
      },
    ],
    []
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setCreateError('');
    if (!createForm.name.trim()) { setCreateError('Name is required.'); return; }
    if (!createForm.email.trim()) { setCreateError('Email is required.'); return; }
    if (createForm.password.length < 6) { setCreateError('Password must be at least 6 characters.'); return; }

    try {
      await createMutation.mutateAsync({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: 'technician',
      });
      setCreateForm({ name: '', email: '', password: '' });
      setShowCreate(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create technician.');
    }
  };

  const openEdit = (t: TechnicianRow) => {
    setEditForm({ name: t.name, email: t.email });
    setEditError('');
    setEditTech(t);
  };

  const handleUpdate = async () => {
    if (!editTech) return;
    setEditError('');
    if (!editForm.name.trim()) { setEditError('Name is required.'); return; }
    if (!editForm.email.trim()) { setEditError('Email is required.'); return; }

    try {
      await updateMutation.mutateAsync({
        id: editTech.id,
        data: { name: editForm.name.trim(), email: editForm.email.trim() },
      });
      setEditTech(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update.');
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
    if (selectedId === deleteId) setSelectedId(null);
  };

  const openResetPassword = (id: number, name: string) => {
    setResetTargetId(id);
    setResetTargetName(name);
    setNewPassword('');
    setResetError('');
    setShowResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!resetTargetId) return;
    setResetError('');
    if (newPassword.length < 6) { setResetError('Min 6 characters.'); return; }
    try {
      await resetMutation.mutateAsync({ id: resetTargetId, password: newPassword });
      setShowResetModal(false);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset.');
    }
  };

  // ── Loading / Error ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500 text-sm py-16">Failed to load technicians.</p>;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Technician Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {technicians.length} technician{technicians.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          onClick={() => { setCreateForm({ name: '', email: '', password: '' }); setCreateError(''); setShowCreate(true); }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Technician
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Search technicians"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 && technicians.length === 0 ? (
        <EmptyState
          title="No technicians found"
          description="Add the first technician to get started."
          action={{ label: '+ Add Technician', onClick: () => { setShowCreate(true); } }}
        />
      ) : (
        <DataTable<TechnicianRow>
          columns={columns}
          data={filtered}
          rowKey={(t) => t.id}
          onRowClick={(t) => setSelectedId(t.id)}
          defaultSortKey="name"
          defaultSortDesc={false}
          exportFileName="technicians"
          emptyMessage="No technicians match your search."
          actionColumn={{
            label: 'Actions',
            render: (t) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedId(t.id); }}
                  className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  aria-label={`View ${t.name}`}
                  title="View detail"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  aria-label={`Edit ${t.name}`}
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openResetPassword(t.id, t.name); }}
                  className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                  aria-label={`Reset password for ${t.name}`}
                  title="Reset password"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>
                {t.id !== me?.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label={`Delete ${t.name}`}
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ),
          }}
        />
      )}

      {/* ── Technician Detail Modal ──────────────────────────────────────────── */}
      <Modal
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={techDetail ? `Technician: ${techDetail.name}` : 'Technician Detail'}
        maxWidth="max-w-4xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : techDetail ? (
          <div className="space-y-6">
            {/* Profile header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {techDetail.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{techDetail.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{techDetail.email}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Joined {techDetail.created_at ? formatDate(techDetail.created_at) : '--'}
                </p>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{techDetail.task_stats.total}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500">Total Tasks</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{techDetail.task_stats.done}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">Completed</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{techDetail.task_stats.overdue}</p>
                <p className="text-xs text-red-600 dark:text-red-500">Overdue</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{formatTime(techDetail.task_stats.total_time_seconds)}</p>
                <p className="text-xs text-purple-600 dark:text-purple-500">Time Logged</p>
              </div>
            </div>

            {/* Task status breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Task Breakdown</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'To Do', value: techDetail.task_stats.to_do, color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
                  { label: 'In Progress', value: techDetail.task_stats.in_progress, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                  { label: 'Working', value: techDetail.task_stats.working_on_it, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
                  { label: 'Review', value: techDetail.task_stats.review, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
                  { label: 'Done', value: techDetail.task_stats.done, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                ].map((s) => (
                  <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${s.color}`}>
                    {s.label}
                    <span className="font-bold">{s.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {techDetail.task_stats.total > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Completion Rate</span>
                  <span>{Math.round((techDetail.task_stats.done / techDetail.task_stats.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${(techDetail.task_stats.done / techDetail.task_stats.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Assigned Projects */}
            {techDetail.projects.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Assigned Projects ({techDetail.projects.length})
                </h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Project</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Health</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tasks</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {techDetail.projects.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-3 py-2">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                              <p className="text-xs text-gray-400">{p.project_code}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.client_name || '--'}</td>
                          <td className="px-3 py-2 text-center">
                            <HealthBadge status={p.health_status} />
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                            {p.my_completed}/{p.my_tasks}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              p.phase === 'execution'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            }`}>
                              {p.phase}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {techDetail.recent_tasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Recent Tasks
                </h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Task</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Project</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {techDetail.recent_tasks.map((t) => {
                        const isOverdue = t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();
                        return (
                          <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                {t.is_tracking && (
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                  </span>
                                )}
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{t.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{t.project_name}</td>
                            <td className="px-3 py-2 text-center">
                              <TaskStatusBadge status={t.status} size="sm" />
                            </td>
                            <td className="px-3 py-2 text-center">
                              {t.due_date ? (
                                <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {formatDate(t.due_date)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600">--</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(Number(t.time_spent_seconds) || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Evidence count */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {techDetail.evidence_count} evidence files uploaded
              </span>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Technician not found.</p>
        )}
      </Modal>

      {/* ── Create Technician Modal ──────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Technician">
        <div className="space-y-4">
          {createError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}
          <div>
            <label htmlFor="tech-name" className={LABEL_CLASS}>Name *</label>
            <input
              id="tech-name"
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="tech-email" className={LABEL_CLASS}>Email *</label>
            <input
              id="tech-email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="tech@example.com"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="tech-password" className={LABEL_CLASS}>Password *</label>
            <input
              id="tech-password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Min 6 characters"
              minLength={6}
              className={INPUT_CLASS}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Role will be set to <span className="font-medium text-green-600 dark:text-green-400">Technician</span> automatically.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Technician'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Technician Modal ────────────────────────────────────────────── */}
      <Modal
        open={editTech !== null}
        onClose={() => setEditTech(null)}
        title={`Edit Technician — ${editTech?.name ?? ''}`}
      >
        <div className="space-y-4">
          {editError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}
          <div>
            <label htmlFor="edit-tech-name" className={LABEL_CLASS}>Name *</label>
            <input
              id="edit-tech-name"
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="edit-tech-email" className={LABEL_CLASS}>Email *</label>
            <input
              id="edit-tech-email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditTech(null)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Reset Password Modal ─────────────────────────────────────────────── */}
      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={`Reset Password — ${resetTargetName}`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          {resetError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {resetError}
            </p>
          )}
          <div>
            <label htmlFor="reset-tech-pw" className={LABEL_CLASS}>New Password *</label>
            <input
              id="reset-tech-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              minLength={6}
              className={INPUT_CLASS}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              disabled={resetMutation.isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Technician"
        message="Are you sure you want to delete this technician? Their task assignments will be unlinked. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
