import { useState, useMemo } from 'react';
import type { Task, TaskStatus, UserRole } from '../../types';
import TaskStatusSelect from './TaskStatusSelect';

interface Props {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  changingTaskId?: number;
  showProject?: boolean;
  userRole?: UserRole;
}

type SortKey = 'name' | 'status' | 'assigned_to_name' | 'due_date' | 'budget';

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

export default function TaskTable({ tasks, onStatusChange, onTaskClick, changingTaskId, showProject = false, userRole }: Props) {
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
        case 'budget':
          cmp = Number(a.budget) - Number(b.budget);
          break;
        default:
          cmp = a.sort_order - b.sort_order;
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [tasks, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
      onClick={() => handleSort(field)}
      role="columnheader"
      aria-sort={sortKey === field ? (sortAsc ? 'ascending' : 'descending') : 'none'}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && (
          <span className="text-blue-500">{sortAsc ? '\u2191' : '\u2193'}</span>
        )}
      </span>
    </th>
  );

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No tasks found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="Task" field="name" />
              {showProject && (
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              )}
              <SortHeader label="Status" field="status" />
              <SortHeader label="Assignee" field="assigned_to_name" />
              <SortHeader label="Due Date" field="due_date" />
              <SortHeader label="Budget" field="budget" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((task) => {
              const urgency = getTaskUrgency(task);
              const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
              const rowBg = urgency === 'over_deadline'
                ? 'bg-red-50/50 hover:bg-red-50'
                : urgency === 'overtime'
                ? 'bg-amber-50/50 hover:bg-amber-50'
                : 'hover:bg-gray-50';

              return (
                <tr
                  key={task.id}
                  className={`${rowBg} transition-colors cursor-pointer`}
                  onClick={() => onTaskClick?.(task)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.name}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                        )}
                      </div>
                      {urgency === 'overtime' && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                          Overtime
                        </span>
                      )}
                      {urgency === 'over_deadline' && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">
                          Over Deadline
                        </span>
                      )}
                    </div>
                  </td>
                  {showProject && (
                    <td className="px-3 py-2.5 text-sm text-gray-600">{task.project_name ?? '--'}</td>
                  )}
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <TaskStatusSelect
                      value={task.status}
                      onChange={(newStatus) => onStatusChange(task.id, newStatus)}
                      disabled={changingTaskId === task.id}
                      userRole={userRole}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600">
                    {task.assigned_to_name ?? (
                      <span className="text-gray-300">Unassigned</span>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                    {task.due_date ? formatDate(task.due_date) : '--'}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600">
                    {Number(task.budget) > 0 ? `Rp ${Number(task.budget).toLocaleString('id-ID')}` : '--'}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-500">
                    {task.evidence_count ?? 0}
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
