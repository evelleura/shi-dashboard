import { useState, useMemo, useEffect } from 'react';
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

type SortKey = 'name' | 'status' | 'assigned_to_name' | 'due_date' | 'time';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTaskUrgency(task: Task): 'overtime' | 'over_deadline' | null {
  if (task.status === 'done' || !task.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  if (due >= today) return null;
  if (task.status === 'working_on_it') return 'overtime';
  if (task.status === 'to_do') return 'over_deadline';
  return null;
}

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
    <span className={`font-mono text-xs ${task.is_tracking ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
      {formatTimeSpent(elapsed)}
    </span>
  );
}

export default function TaskTable({
  tasks, onStatusChange, onTaskClick, onTimerStart, onTimerStop,
  changingTaskId, timerLoadingId, showProject = false, userRole,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('sort_order' as SortKey);
  const [sortAsc, setSortAsc] = useState(true);
  const sorted = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status': {
          const order: Record<string, number> = { working_on_it: 0, to_do: 1, done: 2 };
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
        default:
          cmp = a.sort_order - b.sort_order;
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [tasks, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, field, className = '' }: { label: string; field: SortKey; className?: string }) => (
    <th
      className={`px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none ${className}`}
      onClick={() => handleSort(field)}
      role="columnheader"
      aria-sort={sortKey === field ? (sortAsc ? 'ascending' : 'descending') : 'none'}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && <span className="text-blue-500">{sortAsc ? '\u2191' : '\u2193'}</span>}
      </span>
    </th>
  );

  if (tasks.length === 0) {
    return <div className="text-center py-12 text-gray-400 text-sm">No tasks found</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              {/* Timer column */}
              <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 uppercase w-12" />
              <SortHeader label="Task" field="name" />
              {showProject && (
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              )}
              <SortHeader label="Status" field="status" />
              <SortHeader label="Assignee" field="assigned_to_name" />
              <SortHeader label="Due Date" field="due_date" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Est.</th>
              <SortHeader label="Time" field="time" />
              <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((task) => {
              const urgency = getTaskUrgency(task);
              const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
              const isTimerLoading = timerLoadingId === task.id;
              const rowBg = urgency === 'over_deadline'
                ? 'bg-red-50/50 hover:bg-red-50'
                : urgency === 'overtime'
                ? 'bg-amber-50/50 hover:bg-amber-50'
                : task.is_tracking
                ? 'bg-green-50/30 hover:bg-green-50'
                : 'hover:bg-gray-50';

              return (
                <tr key={task.id} className={`${rowBg} transition-colors`}>
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
                        <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
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
                  <td className="px-3 py-2.5 text-sm text-gray-600 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    {task.assigned_to_name ?? <span className="text-gray-300">--</span>}
                  </td>

                  {/* Due date */}
                  <td
                    className={`px-3 py-2.5 text-sm cursor-pointer ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600'}`}
                    onClick={() => onTaskClick?.(task)}
                  >
                    {task.due_date ? formatDate(task.due_date) : '--'}
                  </td>

                  {/* Estimated hours */}
                  <td className="px-3 py-2.5 text-xs text-gray-500 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    {task.estimated_hours ? `${task.estimated_hours}h` : '--'}
                  </td>

                  {/* Time spent (live) */}
                  <td className="px-3 py-2.5 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                    <LiveTime task={task} />
                  </td>

                  {/* Evidence count */}
                  <td className="px-3 py-2.5 text-sm text-gray-500 text-center cursor-pointer" onClick={() => onTaskClick?.(task)}>
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
    </div>
  );
}
