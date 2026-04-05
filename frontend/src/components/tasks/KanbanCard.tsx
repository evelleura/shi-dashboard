import type { Task, TaskStatus, UserRole } from '../../types';
import TaskStatusSelect from './TaskStatusSelect';
import { formatTimeSpent } from './TaskTimer';

interface Props {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  isChanging?: boolean;
  userRole?: UserRole;
  columnId?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function KanbanCard({ task, onStatusChange, onClick, isChanging, userRole, columnId }: Props) {
  const isTechnician = userRole === 'technician';
  const isOverdue =
    task.due_date &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date();

  const isOvertimeColumn = columnId === 'overtime';
  const isOverDeadlineColumn = columnId === 'over_deadline';

  const borderClass = isOverDeadlineColumn
    ? 'border-red-300 bg-red-50/30'
    : isOvertimeColumn
    ? 'border-amber-300 bg-amber-50/30'
    : isOverdue
    ? 'border-red-300'
    : 'border-gray-200';

  const timeSpent = Number(task.time_spent_seconds) || 0;

  return (
    <div
      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${borderClass}`}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(task); }}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.name}`}
    >
      {task.project_name && (
        <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wide mb-1 truncate">{task.project_name}</p>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Pulsing green dot when tracking */}
          {task.is_tracking && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          )}
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.name}</h4>
        </div>
        {task.evidence_count != null && task.evidence_count > 0 && (
          <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0" aria-label={`${task.evidence_count} evidence files`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {task.evidence_count}
          </span>
        )}
      </div>

      {task.assigned_to_name && (
        <p className="text-xs text-gray-500 mb-1.5">
          <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold leading-5 text-center mr-1 align-middle">
            {task.assigned_to_name.charAt(0).toUpperCase()}
          </span>
          {task.assigned_to_name}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {task.due_date ? (
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {isOverdue ? 'Overdue: ' : 'Due: '}
              {formatDate(task.due_date)}
            </span>
          ) : (
            <span className="text-xs text-gray-300">No due date</span>
          )}
          {/* Show elapsed time if not tracking but has time */}
          {!task.is_tracking && timeSpent > 0 && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
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
