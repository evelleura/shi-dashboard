import { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { Task, TaskStatus, UserRole } from '../../types';
import TaskStatusSelect from './TaskStatusSelect';
import { formatTimeSpent } from './TaskTimer';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';

interface Props {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  changingTaskId?: number;
  showProject?: boolean;
  userRole?: UserRole;
  onSwapTasks?: (taskA: { id: number; sort_order: number }, taskB: { id: number; sort_order: number }) => void;
  isReordering?: boolean;
}

type SortKey = 'order' | 'name' | 'status' | 'assigned_to_name' | 'due_date' | 'time' | 'created_at';
type RowAge = 'new' | 'recent' | 'normal' | 'stale';

function formatDate(dateStr: string, lang: 'id' | 'en' = 'id'): string {
  return new Date(dateStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
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

function TimeSpentDisplay({ task }: { task: Task }) {
  const seconds = Number(task.time_spent_seconds) || 0;
  if (seconds === 0) {
    return <span className="text-gray-300">--:--</span>;
  }
  return (
    <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
      {formatTimeSpent(seconds)}
    </span>
  );
}

const AGE_LEGEND: { key: RowAge; label: string; dot: string }[] = [
  { key: 'new',    label: 'Baru (< 24 jam)',   dot: 'bg-blue-400' },
  { key: 'recent', label: 'Terkini (< 7 hari)', dot: 'bg-emerald-300' },
  { key: 'normal', label: 'Normal',        dot: 'bg-gray-400' },
  { key: 'stale',  label: 'Mangkrak (tanpa kemajuan)', dot: 'bg-gray-300' },
];

const PAGE_SIZES = [10, 25, 50];

export default function TaskTable({
  tasks, onStatusChange, onTaskClick,
  changingTaskId, showProject = false, userRole,
  onSwapTasks, isReordering,
}: Props) {
  const { language } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>('order');
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const sorted = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'order':
          cmp = a.sort_order - b.sort_order;
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status': {
          const statusOrder: Record<string, number> = { working_on_it: 0, in_progress: 1, review: 2, to_do: 3, done: 4 };
          cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
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

  // Sequence numbers are always based on sort_order rank (not display order)
  const sequenceMap = useMemo(() => {
    const byOrder = [...tasks].sort((a, b) => a.sort_order - b.sort_order);
    return new Map(byOrder.map((t, i) => [t.id, i + 1]));
  }, [tasks]);

  // Adjacent tasks in sort_order sequence for up/down reorder
  const tasksByOrder = useMemo(() => [...tasks].sort((a, b) => a.sort_order - b.sort_order), [tasks]);

  const canReorder = !!onSwapTasks && sortKey === 'order' && !sortDesc;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else { setSortKey(key); setSortDesc(false); }
    setPage(0);
  };

  const handleExport = useCallback(() => {
    const rows = sorted.map((taskRow) => ({
      'Tugas': taskRow.name,
      'Deskripsi': taskRow.description ?? '',
      ...(showProject ? { 'Proyek': taskRow.project_name ?? '' } : {}),
      'Status': taskRow.status,
      'Penugasan': taskRow.assigned_to_name ?? '',
      'Tenggat Waktu': taskRow.due_date ? formatDate(taskRow.due_date, language) : '',
      'Estimasi Jam': taskRow.estimated_hours ?? '',
      'Waktu Terpakai': formatTimeSpent(Number(taskRow.time_spent_seconds) || 0),
      'Bukti': taskRow.evidence_count ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tugas');
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
    return <div className="text-center py-12 text-gray-400 text-sm">{t('empty.no_tasks', language)}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{sorted.length} {t('schedule.tasks', language)}</span>
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
          Ekspor Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <SortHeader label="#" field="order" className="w-12" />
              <SortHeader label={t('task.name', language)} field="name" />
              {showProject && (
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('project.title', language)}</th>
              )}
              <SortHeader label={t('label.status', language)} field="status" />
              <SortHeader label={t('label.assignee', language)} field="assigned_to_name" />
              <SortHeader label={t('label.due_date', language)} field="due_date" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estimasi</th>
              <SortHeader label={language === 'id' ? 'Waktu' : 'Time'} field="time" />
              <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{language === 'id' ? 'Bukti' : 'Evidence'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginated.map((task) => {
              const urgency = getTaskUrgency(task);
              const age = getTaskAge(task);
              const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

              // Urgency colors take priority, then age border
              const urgencyBg = urgency === 'over_deadline'
                ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                : urgency === 'overtime'
                ? 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
                : task.status === 'review'
                ? 'bg-purple-50/30 hover:bg-purple-50 dark:bg-purple-900/20 dark:hover:bg-purple-900/30'
                : age === 'stale'
                ? 'bg-gray-50/60 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-700'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800';

              const ageBorder = !urgency ? AGE_BORDER[age] : '';

              const seqNum = sequenceMap.get(task.id) ?? 0;
              const orderIdx = tasksByOrder.findIndex((t) => t.id === task.id);
              const prevTask = orderIdx > 0 ? tasksByOrder[orderIdx - 1] : null;
              const nextTask = orderIdx < tasksByOrder.length - 1 ? tasksByOrder[orderIdx + 1] : null;

              return (
                <tr key={task.id} className={`${urgencyBg} ${ageBorder} transition-colors`}>
                  {/* Sequence number + reorder */}
                  <td className="px-2 py-2.5 w-12" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-center gap-0.5">
                      {canReorder && prevTask ? (
                        <button
                          title={t('task.move_up', language)}
                          disabled={isReordering}
                          onClick={() => onSwapTasks!({ id: task.id, sort_order: task.sort_order }, { id: prevTask.id, sort_order: prevTask.sort_order })}
                          className="text-gray-300 hover:text-blue-500 disabled:opacity-30 leading-none"
                        >
                          &#9650;
                        </button>
                      ) : canReorder ? <span className="h-3.5" /> : null}
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">#{seqNum}</span>
                      {canReorder && nextTask ? (
                        <button
                          title={t('task.move_down', language)}
                          disabled={isReordering}
                          onClick={() => onSwapTasks!({ id: task.id, sort_order: task.sort_order }, { id: nextTask.id, sort_order: nextTask.sort_order })}
                          className="text-gray-300 hover:text-blue-500 disabled:opacity-30 leading-none"
                        >
                          &#9660;
                        </button>
                      ) : canReorder ? <span className="h-3.5" /> : null}
                    </div>
                  </td>
                  {/* Task name */}
                  <td className="px-3 py-2.5 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${age === 'stale' && !urgency ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{task.name}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                        )}
                      </div>
                      {urgency === 'overtime' && (
                        <span className="shrink-0 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">LBR</span>
                      )}
                      {urgency === 'over_deadline' && (
                        <span className="shrink-0 text-[10px] font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">TLB</span>
                      )}
                      {age === 'new' && !urgency && (
                        <span className="shrink-0 text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">BARU</span>
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
                    {task.due_date ? formatDate(task.due_date, language) : '--'}
                  </td>

                  {/* Estimated hours */}
                  <td className={`px-3 py-2.5 text-xs cursor-pointer ${age === 'stale' && !urgency ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => onTaskClick?.(task)}>
                    {task.estimated_hours ? `${task.estimated_hours}h` : '--'}
                  </td>

                  {/* Time spent */}
                  <td className="px-3 py-2.5 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    <TimeSpentDisplay task={task} />
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
            <span>{language === 'id' ? 'Tampilkan' : 'Show'}</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>{language === 'id' ? 'per halaman' : 'per page'}</span>
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
