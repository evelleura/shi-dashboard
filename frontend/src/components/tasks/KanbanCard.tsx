import type { Task, TaskStatus } from '../../types';
import TaskStatusSelect from './TaskStatusSelect';

interface Props {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  isChanging?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function KanbanCard({ task, onStatusChange, onClick, isChanging }: Props) {
  const isOverdue =
    task.due_date &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date();

  return (
    <div
      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(task); }}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.name}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">{task.name}</h4>
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
        {task.due_date ? (
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {isOverdue ? 'Overdue: ' : 'Due: '}
            {formatDate(task.due_date)}
          </span>
        ) : (
          <span className="text-xs text-gray-300">No due date</span>
        )}
        <div onClick={(e) => e.stopPropagation()} role="presentation">
          <TaskStatusSelect
            value={task.status}
            onChange={(newStatus) => onStatusChange(task.id, newStatus)}
            disabled={isChanging}
            size="sm"
          />
        </div>
      </div>

      {task.budget > 0 && (
        <p className="text-[10px] text-gray-400 mt-1.5">
          Budget: Rp {Number(task.budget).toLocaleString('id-ID')}
        </p>
      )}
    </div>
  );
}
