import type { Task, TaskStatus, UserRole } from '../../types';
import TaskStatusSelect from './TaskStatusSelect';
import { formatTimeSpent } from './TaskTimer';

interface Props {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  onTimerStart?: (taskId: number) => void;
  onTimerStop?: (taskId: number) => void;
  isChanging?: boolean;
  isTimerLoading?: boolean;
  userRole?: UserRole;
  columnId?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function KanbanCard({
  task, onStatusChange, onClick, onTimerStart, onTimerStop,
  isChanging, isTimerLoading, userRole, columnId,
}: Props) {
  const isTechnician = userRole === 'technician';
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
  const isOvertimeColumn = columnId === 'overtime';
  const isOverDeadlineColumn = columnId === 'over_deadline';
  const isReview = task.status === 'review';

  const borderClass = isOverDeadlineColumn
    ? 'border-red-300 bg-red-50/30'
    : isOvertimeColumn
    ? 'border-amber-300 bg-amber-50/30'
    : task.is_tracking
    ? 'border-green-400 bg-green-50/20'
    : isReview
    ? 'border-purple-300 bg-purple-50/20'
    : isOverdue
    ? 'border-red-300'
    : 'border-gray-200';

  const timeSpent = Number(task.time_spent_seconds) || 0;
  const showTimer = task.status !== 'done' && (onTimerStart || onTimerStop);

  return (
    <div
      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow ${borderClass}`}
      role="listitem"
      aria-label={`Task: ${task.name}`}
    >
      {/* Project label */}
      {task.project_name && (
        <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wide mb-1 truncate">{task.project_name}</p>
      )}

      {/* Title row: play button + name + evidence */}
      <div className="flex items-start gap-2 mb-2">
        {/* Play/Pause button */}
        {showTimer && (
          <button
            onClick={(e) => { e.stopPropagation(); task.is_tracking ? onTimerStop?.(task.id) : onTimerStart?.(task.id); }}
            disabled={isTimerLoading}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              task.is_tracking
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            } disabled:opacity-50`}
            aria-label={task.is_tracking ? 'Stop timer' : 'Start timer'}
          >
            {isTimerLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
            ) : task.is_tracking ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Task name */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick?.(task)}>
          <div className="flex items-center gap-1.5">
            {task.is_tracking && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            )}
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.name}</h4>
          </div>
        </div>

        {/* Evidence count */}
        {task.evidence_count != null && task.evidence_count > 0 && (
          <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0 cursor-pointer" onClick={() => onClick?.(task)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {task.evidence_count}
          </span>
        )}
      </div>

      {/* Assignee */}
      {task.assigned_to_name && (
        <p className="text-xs text-gray-500 mb-1.5 cursor-pointer" onClick={() => onClick?.(task)}>
          <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold leading-5 text-center mr-1 align-middle">
            {task.assigned_to_name.charAt(0).toUpperCase()}
          </span>
          {task.assigned_to_name}
        </p>
      )}

      {/* Due date + time + status */}
      <div className="flex items-center justify-between mt-2 cursor-pointer" onClick={() => onClick?.(task)}>
        <div className="flex items-center gap-2">
          {task.due_date ? (
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {isOverdue ? 'Overdue: ' : 'Due: '}
              {formatDate(task.due_date)}
            </span>
          ) : (
            <span className="text-xs text-gray-300">No due date</span>
          )}
          {/* Elapsed time */}
          {timeSpent > 0 && (
            <span className={`text-[10px] flex items-center gap-0.5 ${task.is_tracking ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimeSpent(timeSpent)}
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()} role="presentation">
          <TaskStatusSelect
            value={task.status}
            onChange={(newStatus) => onStatusChange(task.id, newStatus)}
            disabled={isChanging}
            size="sm"
            userRole={userRole}
          />
        </div>
      </div>

      {!isTechnician && task.budget > 0 && (
        <p className="text-[10px] text-gray-400 mt-1.5">
          Budget: Rp {Number(task.budget).toLocaleString('id-ID')}
        </p>
      )}
    </div>
  );
}
