import { useMemo } from 'react';
import type { Task, TaskStatus, UserRole } from '../../types';
import KanbanCard from './KanbanCard';

interface Props {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  onTimerStart?: (taskId: number) => void;
  onTimerStop?: (taskId: number) => void;
  changingTaskId?: number;
  timerLoadingId?: number;
  userRole?: UserRole;
}

/**
 * Kanban columns:
 * 1. To Do (gray) -- to_do, not overdue
 * 2. In Progress (blue) -- in_progress AND working_on_it (not overdue). Cards with working_on_it get pulsing indicator.
 * 3. Review (purple)
 * 4. Done (green)
 * 5. Overtime (amber) -- (in_progress OR working_on_it) AND overdue
 * 6. Over Deadline (red) -- to_do AND overdue
 */
type KanbanColumn = 'to_do' | 'in_progress' | 'review' | 'done' | 'overtime' | 'over_deadline';

interface ColumnDef {
  id: KanbanColumn;
  label: string;
  borderColor: string;
  headerBg: string;
  headerText: string;
  icon?: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'to_do', label: 'To Do', borderColor: 'border-t-gray-400', headerBg: 'bg-gray-50 dark:bg-gray-700', headerText: 'text-gray-700 dark:text-gray-300' },
  { id: 'in_progress', label: 'In Progress', borderColor: 'border-t-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-900/30', headerText: 'text-blue-700 dark:text-blue-400' },
  { id: 'review', label: 'Review', borderColor: 'border-t-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-900/30', headerText: 'text-purple-700 dark:text-purple-400' },
  { id: 'done', label: 'Done', borderColor: 'border-t-green-500', headerBg: 'bg-green-50 dark:bg-green-900/30', headerText: 'text-green-700 dark:text-green-400' },
  { id: 'overtime', label: 'Overtime', borderColor: 'border-t-amber-500', headerBg: 'bg-amber-50 dark:bg-amber-900/30', headerText: 'text-amber-700 dark:text-amber-400', icon: 'warning' },
  { id: 'over_deadline', label: 'Over Deadline', borderColor: 'border-t-red-500', headerBg: 'bg-red-50 dark:bg-red-900/30', headerText: 'text-red-700 dark:text-red-400', icon: 'alert' },
];

function isOverdue(task: Task): boolean {
  if (!task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function WarningIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onTimerStart, onTimerStop, changingTaskId, timerLoadingId, userRole }: Props) {
  const grouped = useMemo(() => {
    const map: Record<KanbanColumn, Task[]> = {
      to_do: [],
      in_progress: [],
      review: [],
      done: [],
      overtime: [],
      over_deadline: [],
    };

    for (const task of tasks) {
      if (task.status === 'done') {
        map.done.push(task);
      } else if (task.status === 'review') {
        map.review.push(task);
      } else if ((task.status === 'working_on_it' || task.status === 'in_progress') && isOverdue(task)) {
        map.overtime.push(task);
      } else if (task.status === 'to_do' && isOverdue(task)) {
        map.over_deadline.push(task);
      } else if (task.status === 'working_on_it' || task.status === 'in_progress') {
        // Both in_progress and working_on_it go to the "In Progress" column
        // working_on_it cards will show a pulsing green dot via KanbanCard
        map.in_progress.push(task);
      } else {
        map.to_do.push(task);
      }
    }

    // Sort by sort_order within each column
    for (const key of Object.keys(map) as KanbanColumn[]) {
      map[key].sort((a, b) => a.sort_order - b.sort_order);
    }

    return map;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4" role="region" aria-label="Kanban board">
      {COLUMNS.map((col) => {
        const colTasks = grouped[col.id];
        return (
          <div
            key={col.id}
            className={`rounded-xl border border-gray-200 dark:border-gray-700 border-t-4 ${col.borderColor} min-h-[200px] flex flex-col`}
          >
            <div className={`${col.headerBg} px-3 py-2.5 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {col.icon === 'warning' && <WarningIcon />}
                  {col.icon === 'alert' && <AlertIcon />}
                  <h3 className={`text-sm font-semibold ${col.headerText}`}>{col.label}</h3>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
              {colTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400 dark:text-gray-500">No tasks</p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onClick={onTaskClick}
                    onTimerStart={onTimerStart}
                    onTimerStop={onTimerStop}
                    isChanging={changingTaskId === task.id}
                    isTimerLoading={timerLoadingId === task.id}
                    userRole={userRole}
                    columnId={col.id}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
