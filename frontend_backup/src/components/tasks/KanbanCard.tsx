import type { Task, TaskStatus, UserRole } from '../../types';
import TaskStatusSelect from './TaskStatusSelect';
import { formatTimeSpent } from './TaskTimer';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';

interface Props {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  isChanging?: boolean;
  userRole?: UserRole;
  columnId?: string;
  isBlocked?: boolean;
  sequenceNum?: number;
}

function formatDate(dateStr: string, lang: 'id' | 'en' = 'id'): string {
  return new Date(dateStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short' });
}

export default function KanbanCard({
  task, onStatusChange, onClick,
  isChanging, userRole, columnId, isBlocked, sequenceNum,
}: Props) {
  const { language } = useLanguage();
  const isTechnician = userRole === 'technician';
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
  const isOvertimeColumn = columnId === 'overtime';
  const isOverDeadlineColumn = columnId === 'over_deadline';
  const isReview = task.status === 'review';

  const borderClass = isOverDeadlineColumn
    ? 'border-red-300 bg-red-50/30'
    : isOvertimeColumn
    ? 'border-amber-300 bg-amber-50/30'
    : isReview
    ? 'border-purple-300 bg-purple-50/20 dark:bg-purple-900/20'
    : isOverdue
    ? 'border-red-300 dark:border-red-700'
    : 'border-gray-200 dark:border-gray-700';

  const timeSpent = Number(task.time_spent_seconds) || 0;

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow ${borderClass}`}
      role="listitem"
      aria-label={`Task: ${task.name}`}
    >
      {sequenceNum != null && (
        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">#{sequenceNum}</span>
      )}
      {task.project_name && (
        <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wide truncate mb-1 pr-6">{task.project_name}</p>
      )}

      {/* Title row: name + evidence */}
      <div className="flex items-start gap-2 mb-2">
        {/* Task name */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick?.(task)}>
          <div className="flex items-center gap-1.5">
            {isBlocked && (
              <span title={`${t('task.waiting_for', language)}: ${task.depends_on_name ?? (language === 'id' ? 'tugas prasyarat' : 'prerequisite task')}`}>
                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
            )}
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{task.name}</h4>
          </div>
          {isBlocked && task.depends_on_name && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{t('task.waiting_for', language)}: {task.depends_on_name}</p>
          )}
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 cursor-pointer" onClick={() => onClick?.(task)}>
          <span className="inline-block w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold leading-5 text-center mr-1 align-middle">
            {task.assigned_to_name.charAt(0).toUpperCase()}
          </span>
          {task.assigned_to_name}
        </p>
      )}

      {/* Due date + time */}
      <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={() => onClick?.(task)}>
        {task.due_date ? (
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {isOverdue ? t('task.overdue_prefix', language) : t('task.due', language)}{' '}
            {formatDate(task.due_date, language)}
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">{t('task.no_due_date', language)}</span>
        )}
        {timeSpent > 0 && (
          <span className="text-[10px] flex items-center gap-0.5 text-gray-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTimeSpent(timeSpent)}
          </span>
        )}
      </div>
      {/* Status select - own row */}
      <div className="mt-1.5" onClick={(e) => e.stopPropagation()} role="presentation">
        <TaskStatusSelect
          value={task.status}
          onChange={(newStatus) => onStatusChange(task.id, newStatus)}
          disabled={isChanging}
          size="sm"
          userRole={userRole}
        />
      </div>

    </div>
  );
}
