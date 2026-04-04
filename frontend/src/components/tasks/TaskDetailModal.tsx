import Modal from '../ui/Modal';
import TaskStatusSelect from './TaskStatusSelect';
import type { Task, TaskStatus, UserRole } from '../../types';

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  isChanging?: boolean;
  userRole?: UserRole;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TaskDetailModal({ task, open, onClose, onStatusChange, isChanging, userRole }: Props) {
  if (!task) return null;

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
  const isOvertime = isOverdue && task.status === 'working_on_it';
  const isOverDeadline = isOverdue && task.status === 'to_do';

  return (
    <Modal open={open} onClose={onClose} title="Task Details" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Title and status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.name}</h3>
          <div className="flex items-center gap-3">
            <TaskStatusSelect
              value={task.status}
              onChange={(s) => onStatusChange(task.id, s)}
              disabled={isChanging}
              size="md"
              userRole={userRole}
            />
            {task.is_survey_task && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">Survey Task</span>
            )}
            {isOvertime && (
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">Overtime</span>
            )}
            {isOverDeadline && (
              <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium">Over Deadline</span>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{task.description}</p>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Assignee</p>
            <p className="text-sm font-medium text-gray-900">{task.assigned_to_name ?? 'Unassigned'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Project</p>
            <p className="text-sm font-medium text-gray-900">{task.project_name ?? '--'}</p>
          </div>
          <div className={`rounded-lg p-3 ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {task.due_date ? formatDate(task.due_date) : 'No due date'}
              {isOverdue && ' (overdue)'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-sm font-medium text-gray-900">
              {Number(task.budget) > 0 ? `Rp ${Number(task.budget).toLocaleString('id-ID')}` : '--'}
            </p>
          </div>
        </div>

        {/* Timeline */}
        {(task.timeline_start || task.timeline_end) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Timeline</p>
            <p className="text-sm text-gray-700">
              {task.timeline_start ? formatDate(task.timeline_start) : '?'} -- {task.timeline_end ? formatDate(task.timeline_end) : '?'}
            </p>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{task.notes}</p>
          </div>
        )}

        {/* Evidence count */}
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500">
            Evidence files: {task.evidence_count ?? 0}
          </p>
        </div>
      </div>
    </Modal>
  );
}
