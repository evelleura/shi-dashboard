import { useState } from 'react';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { useChangeTaskStatus } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import ViewToggle from '../components/tasks/ViewToggle';
import type { Task, TaskStatus } from '../types';

export default function TechnicianTasksPage() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const changeStatus = useChangeTaskStatus();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500">
            {data.recent_tasks.length} task{data.recent_tasks.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
        <ViewToggle view={taskView} onChange={setTaskView} />
      </div>

      {data.recent_tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="mt-4 text-sm text-gray-500">No tasks assigned to you yet.</p>
          <p className="text-xs text-gray-400 mt-1">Tasks will appear here once your manager assigns them.</p>
        </div>
      ) : taskView === 'kanban' ? (
        <KanbanBoard
          tasks={data.recent_tasks}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
          changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
          userRole={user?.role}
        />
      ) : (
        <TaskTable
          tasks={data.recent_tasks}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
          changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
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
