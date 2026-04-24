import { useState } from 'react';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { useChangeTaskStatus } from '../hooks/useTasks';
import { useStartTimer, useStopTimer } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import ViewToggle from '../components/tasks/ViewToggle';
import { formatTimeSpent } from '../components/tasks/TaskTimer';
import type { Task, TaskStatus } from '../types';

function ActiveTaskBanner({ task, onStop, isLoading }: { task: Task; onStop: () => void; isLoading: boolean }) {
  return (
    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-3">
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Currently working on</p>
        <p className="text-sm font-semibold text-green-900 dark:text-green-100 truncate">{task.name}</p>
        {task.project_name && <p className="text-xs text-green-600 dark:text-green-400">{task.project_name}</p>}
      </div>
      <p className="text-lg font-mono font-bold text-green-700 dark:text-green-400">{formatTimeSpent(Number(task.time_spent_seconds) || 0)}</p>
      <button
        onClick={onStop}
        disabled={isLoading}
        className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        Stop
      </button>
    </div>
  );
}

export default function TechnicianTasksPage() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const changeStatus = useChangeTaskStatus();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const { user } = useAuth();

  const [taskView, setTaskView] = useState<'kanban' | 'table'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Failed to load tasks.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Retry</button>
      </div>
    );
  }

  const handleStatusChange = (taskId: number, status: TaskStatus) => {
    const task = data.recent_tasks.find((t) => t.id === taskId);
    if (task) {
      changeStatus.mutate({ id: taskId, status, projectId: task.project_id });
    }
  };

  const activeTask = data.recent_tasks.find((t) => t.is_tracking);

  const handleTimerStart = (id: number) => {
    const t = data.recent_tasks.find((x) => x.id === id);
    if (t) startTimer.mutate({ taskId: id, projectId: t.project_id });
  };

  const handleTimerStop = (id: number) => {
    const t = data.recent_tasks.find((x) => x.id === id);
    if (t) stopTimer.mutate({ taskId: id, projectId: t.project_id });
  };

  const timerLoading = startTimer.isPending ? startTimer.variables?.taskId : stopTimer.isPending ? stopTimer.variables?.taskId : undefined;

  return (
    <div className="space-y-4">
      {/* Currently Working On banner */}
      {activeTask && (
        <ActiveTaskBanner
          task={activeTask}
          onStop={() => handleTimerStop(activeTask.id)}
          isLoading={!!timerLoading}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.recent_tasks.length} task{data.recent_tasks.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
        <ViewToggle view={taskView} onChange={setTaskView} />
      </div>

      {data.recent_tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No tasks assigned to you yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tasks will appear here once your manager assigns them.</p>
        </div>
      ) : taskView === 'kanban' ? (
        <KanbanBoard
          tasks={data.recent_tasks}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
          onTimerStart={handleTimerStart}
          onTimerStop={handleTimerStop}
          changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
          timerLoadingId={timerLoading}
          userRole={user?.role}
        />
      ) : (
        <TaskTable
          tasks={data.recent_tasks}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
          onTimerStart={handleTimerStart}
          onTimerStop={handleTimerStop}
          changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
          timerLoadingId={timerLoading}
          showProject
          userRole={user?.role}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
        isChanging={changeStatus.isPending}
        userRole={user?.role}
      />
    </div>
  );
}
