import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { useChangeTaskStatus } from '../hooks/useTasks';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import ViewToggle from '../components/tasks/ViewToggle';
import type { Task, TaskStatus } from '../types';

export default function TechnicianDashboard() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const changeStatus = useChangeTaskStatus();
  const navigate = useNavigate();

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
        <p className="text-red-500 text-sm">Failed to load dashboard.</p>
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

  const stats = data.my_tasks;
  const statCards = [
    { label: 'Total Tasks', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'To Do', value: stats.to_do, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'In Progress', value: stats.working_on_it, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Done', value: stats.done, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Stuck', value: stats.stuck, color: stats.stuck > 0 ? 'text-red-600' : 'text-gray-600', bg: stats.stuck > 0 ? 'bg-red-50' : 'bg-gray-50' },
    { label: 'Overdue', value: stats.overdue, color: stats.overdue > 0 ? 'text-orange-600' : 'text-gray-600', bg: stats.overdue > 0 ? 'bg-orange-50' : 'bg-gray-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-sm text-gray-500">Your tasks and assigned projects</p>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Assigned Projects */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Assigned Projects</h2>
        {data.assigned_projects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No projects assigned to you yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.assigned_projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{proj.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tasks: {proj.my_completed}/{proj.my_task_count}
                  <span className="mx-1">|</span>
                  Phase: {proj.phase === 'survey' ? 'Survey' : 'Execution'}
                </p>
                {proj.my_task_count > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(proj.my_completed / proj.my_task_count) * 100}%` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My Tasks (kanban/table) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
          <ViewToggle view={taskView} onChange={setTaskView} />
        </div>

        {data.recent_tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No tasks assigned to you.</p>
        ) : taskView === 'kanban' ? (
          <KanbanBoard
            tasks={data.recent_tasks}
            onStatusChange={handleStatusChange}
            onTaskClick={setSelectedTask}
            changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
          />
        ) : (
          <TaskTable
            tasks={data.recent_tasks}
            onStatusChange={handleStatusChange}
            onTaskClick={setSelectedTask}
            changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
            showProject
          />
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
        isChanging={changeStatus.isPending}
      />
    </div>
  );
}
