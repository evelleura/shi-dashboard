import { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { Task, TaskStatus, UserRole } from '../../types';
import TaskStatusSelect from './TaskStatusSelect';
import { formatTimeSpent } from './TaskTimer';

interface Props {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  onTimerStart?: (taskId: number) => void;
  onTimerStop?: (taskId: number) => void;
  changingTaskId?: number;
  timerLoadingId?: number;
  showProject?: boolean;
  userRole?: UserRole;
}

type SortKey = 'name' | 'status' | 'assigned_to_name' | 'due_date' | 'time' | 'created_at';
type RowAge = 'new' | 'recent' | 'normal' | 'stale';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTaskUrgency(task: Task): 'overtime' | 'over_deadline' | null {
  if (task.status === 'done' || task.status === 'review' || !task.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  if (due >= today) return null;
  if (task.status === 'working_on_it' || task.status === 'in_progress') return 'overtime';
  if (task.status === 'to_do') return 'over_deadline';
  return null;
}

function getTaskAge(task: Task): RowAge {
  const created = task.created_at ? new Date(task.created_at).getTime() : 0;
  const updated = task.updated_at ? new Date(task.updated_at).getTime() : created;
  const latest = Math.max(created, updated);
  const now = Date.now();
  const hoursAgo = (now - latest) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 'new';
  if (hoursAgo < 24 * 7) return 'recent';
  // Stale: to_do status and not updated in 14+ days
  if (hoursAgo > 24 * 14 && task.status === 'to_do') return 'stale';
  return 'normal';
}

const AGE_BORDER: Record<RowAge, string> = {
  new:    'border-l-4 border-l-blue-400',
  recent: 'border-l-4 border-l-emerald-300',
  normal: '',
  stale:  'border-l-4 border-l-gray-300',
};

function getElapsedSeconds(task: Task): number {
  const base = Number(task.time_spent_seconds) || 0;
  if (!task.is_tracking || !task.timer_started_at) return base;
  const started = new Date(task.timer_started_at).getTime();
  const diff = Math.max(0, Math.floor((Date.now() - started) / 1000));
  return base + diff;
}

function LiveTime({ task }: { task: Task }) {
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(task));

  useEffect(() => {
    setElapsed(getElapsedSeconds(task));
    if (!task.is_tracking) return;
    const iv = setInterval(() => setElapsed(getElapsedSeconds(task)), 1000);
    return () => clearInterval(iv);
  }, [task.is_tracking, task.timer_started_at, task.time_spent_seconds]);

  if (elapsed === 0 && !task.is_tracking) {
    return <span className="text-gray-300">--:--</span>;
  }

  return (
    <span className={`font-mono text-xs ${task.is_tracking ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
      {formatTimeSpent(elapsed)}
    </span>
  );
}

const AGE_LEGEND: { key: RowAge; label: string; dot: string }[] = [
  { key: 'new',    label: 'New (< 24h)',   dot: 'bg-blue-400' },
  { key: 'recent', label: 'Recent (< 7d)', dot: 'bg-emerald-300' },
  { key: 'normal', label: 'Normal',        dot: 'bg-gray-400' },
  { key: 'stale',  label: 'Stale (no progress)', dot: 'bg-gray-300' },
];

const PAGE_SIZES = [10, 25, 50];

export default function TaskTable({
  tasks, onStatusChange, onTaskClick, onTimerStart, onTimerStop,
  changingTaskId, timerLoadingId, showProject = false, userRole,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const sorted = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status': {
          const order: Record<string, number> = { working_on_it: 0, in_progress: 1, review: 2, to_do: 3, done: 4 };
          cmp = (order[a.status] ?? 9) - (order[b.status] ?? 9);
          break;
        }
        case 'assigned_to_name':
          cmp = (a.assigned_to_name ?? '').localeCompare(b.assigned_to_name ?? '');
          break;
        case 'due_date':
          cmp = (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999');
          break;
        case 'time':
          cmp = (Number(a.time_spent_seconds) || 0) - (Number(b.time_spent_seconds) || 0);
          break;
        case 'created_at':
          cmp = (a.created_at ?? '').localeCompare(b.created_at ?? '');
          break;
        default:
          cmp = a.sort_order - b.sort_order;
      }
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [tasks, sortKey, sortDesc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else { setSortKey(key); setSortDesc(true); }
    setPage(0);
  };

  const handleExport = useCallback(() => {
    const rows = sorted.map((t) => ({
      'Task': t.name,
      'Description': t.description ?? '',
      ...(showProject ? { 'Project': t.project_name ?? '' } : {}),
      'Status': t.status,
      'Assignee': t.assigned_to_name ?? '',
      'Due Date': t.due_date ? formatDate(t.due_date) : '',
      'Est. Hours': t.estimated_hours ?? '',
      'Time Spent': formatTimeSpent(Number(t.time_spent_seconds) || 0),
      'Evidence': t.evidence_count ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, 'tasks.xlsx');
  }, [sorted, showProject]);

  const SortHeader = ({ label, field, className = '' }: { label: string; field: SortKey; className?: string }) => (
    <th
      className={`px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none ${className}`}
      onClick={() => handleSort(field)}
      role="columnheader"
      aria-sort={sortKey === field ? (sortDesc ? 'descending' : 'ascending') : 'none'}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && <span className="text-blue-500">{sortDesc ? '\u2193' : '\u2191'}</span>}
      </span>
    </th>
  );

  if (tasks.length === 0) {
    return <div className="text-center py-12 text-gray-400 text-sm">No tasks found</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{sorted.length} task{sorted.length !== 1 ? 's' : ''}</span>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-gray-300">|</span>
            {AGE_LEGEND.map((l) => (
              <span key={l.key} className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${l.dot}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {/* Timer column */}
              <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12" />
              <SortHeader label="Task" field="name" />
              {showProject && (
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Project</th>
              )}
              <SortHeader label="Status" field="status" />
              <SortHeader label="Assignee" field="assigned_to_name" />
              <SortHeader label="Due Date" field="due_date" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Est.</th>
              <SortHeader label="Time" field="time" />
              <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginated.map((task) => {
              const urgency = getTaskUrgency(task);
              const age = getTaskAge(task);
              const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
              const isTimerLoading = timerLoadingId === task.id;

              // Urgency colors take priority, then age border
              const urgencyBg = urgency === 'over_deadline'
                ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                : urgency === 'overtime'
                ? 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
                : task.is_tracking
                ? 'bg-green-50/30 hover:bg-green-50 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                : task.status === 'review'
                ? 'bg-purple-50/30 hover:bg-purple-50 dark:bg-purple-900/20 dark:hover:bg-purple-900/30'
                : age === 'stale'
                ? 'bg-gray-50/60 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-700'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800';

              const ageBorder = !urgency ? AGE_BORDER[age] : '';

              return (
                <tr key={task.id} className={`${urgencyBg} ${ageBorder} transition-colors`}>
                  {/* Play/Pause button */}
                  <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {task.status !== 'done' && onTimerStart && onTimerStop ? (
                      <button
                        onClick={() => task.is_tracking ? onTimerStop(task.id) : onTimerStart(task.id)}
                        disabled={isTimerLoading}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          task.is_tracking
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        } disabled:opacity-50`}
                        aria-label={task.is_tracking ? 'Stop timer' : 'Start timer'}
                      >
                        {isTimerLoading ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current" />
                        ) : task.is_tracking ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    ) : task.status === 'done' ? (
                      <span className="text-green-400" aria-label="Completed">
                        <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : null}
                  </td>

                  {/* Task name */}
                  <td className="px-3 py-2.5 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    <div className="flex items-center gap-2">
                      {task.is_tracking && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${age === 'stale' && !urgency ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{task.name}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                        )}
                      </div>
                      {urgency === 'overtime' && (
                        <span className="shrink-0 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">OT</span>
                      )}
                      {urgency === 'over_deadline' && (
                        <span className="shrink-0 text-[10px] font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">OD</span>
                      )}
                      {age === 'new' && !urgency && (
                        <span className="shrink-0 text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                  </td>

                  {showProject && (
                    <td className="px-3 py-2.5 text-xs text-blue-600 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                      {task.project_name ?? '--'}
                    </td>
                  )}

                  {/* Status */}
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <TaskStatusSelect
                      value={task.status}
                      onChange={(s) => onStatusChange(task.id, s)}
                      disabled={changingTaskId === task.id}
                      userRole={userRole}
                    />
                  </td>

                  {/* Assignee */}
                  <td className={`px-3 py-2.5 text-sm cursor-pointer ${age === 'stale' && !urgency ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`} onClick={() => onTaskClick?.(task)}>
                    {task.assigned_to_name ?? <span className="text-gray-300">--</span>}
                  </td>

                  {/* Due date */}
                  <td
                    className={`px-3 py-2.5 text-sm cursor-pointer ${isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : age === 'stale' && !urgency ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}
                    onClick={() => onTaskClick?.(task)}
                  >
                    {task.due_date ? formatDate(task.due_date) : '--'}
                  </td>

                  {/* Estimated hours */}
                  <td className={`px-3 py-2.5 text-xs cursor-pointer ${age === 'stale' && !urgency ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => onTaskClick?.(task)}>
                    {task.estimated_hours ? `${task.estimated_hours}h` : '--'}
                  </td>

                  {/* Time spent (live) */}
                  <td className="px-3 py-2.5 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    <LiveTime task={task} />
                  </td>

                  {/* Evidence count */}
                  <td className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 text-center cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    {(task.evidence_count ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {task.evidence_count}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > PAGE_SIZES[0] && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &laquo;
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &lsaquo;
            </button>
            <span className="px-2 py-1 font-medium">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
