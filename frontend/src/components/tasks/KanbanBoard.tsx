import { useMemo } from 'react';
import type { Task, TaskStatus } from '../../types';
import KanbanCard from './KanbanCard';

interface Props {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  changingTaskId?: number;
}

const COLUMNS: { status: TaskStatus; label: string; color: string; headerBg: string }[] = [
  { status: 'to_do', label: 'To Do', color: 'border-t-gray-400', headerBg: 'bg-gray-50' },
  { status: 'working_on_it', label: 'Working On It', color: 'border-t-blue-500', headerBg: 'bg-blue-50' },
  { status: 'done', label: 'Done', color: 'border-t-green-500', headerBg: 'bg-green-50' },
  { status: 'stuck', label: 'Stuck', color: 'border-t-red-500', headerBg: 'bg-red-50' },
];

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, changingTaskId }: Props) {
  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      to_do: [],
      working_on_it: [],
      done: [],
      stuck: [],
    };
    for (const task of tasks) {
      if (map[task.status]) {
        map[task.status].push(task);
      }
    }
    // Sort by sort_order within each column
    for (const status of Object.keys(map) as TaskStatus[]) {
      map[status].sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Kanban board">
      {COLUMNS.map((col) => {
        const colTasks = grouped[col.status];
        return (
          <div
            key={col.status}
            className={`rounded-xl border border-gray-200 border-t-4 ${col.color} min-h-[200px] flex flex-col`}
          >
            <div className={`${col.headerBg} px-3 py-2.5 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
              {colTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">No tasks</p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onClick={onTaskClick}
                    isChanging={changingTaskId === task.id}
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
