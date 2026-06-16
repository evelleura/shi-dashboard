import { useState } from 'react';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { useChangeTaskStatus } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import ViewToggle from '../components/tasks/ViewToggle';
import type { Task, TaskStatus } from '../types';

export default function TechnicianTasksPage() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const changeStatus = useChangeTaskStatus();
  const { user } = useAuth();
  const { language } = useLanguage();
  const id = language === 'id';

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
        <p className="text-red-500 text-sm">{t('error.load_failed', language)}.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">{t('action.retry', language)}</button>
      </div>
    );
  }

  const handleStatusChange = (taskId: number, status: TaskStatus) => {
    const task = data.recent_tasks.find((t) => t.id === taskId);
    if (task) {
      changeStatus.mutate({ id: taskId, status, projectId: task.project_id });
    }
  };

  const todayStr = new Date().toDateString();
  const todayDoneTasks = data.recent_tasks.filter(
    (t) => t.status === 'done' && t.updated_at && new Date(t.updated_at).toDateString() === todayStr
  );
  const activeTasks = data.recent_tasks.filter((t) => t.status !== 'done');

  const taskCount = activeTasks.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('nav.my_tasks', language)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {id
              ? `${taskCount} tugas aktif ditugaskan kepadamu`
              : `${taskCount} active task${taskCount !== 1 ? 's' : ''} assigned to you`}
          </p>
        </div>
        <ViewToggle view={taskView} onChange={setTaskView} />
      </div>

      {activeTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {id ? 'Belum ada tugas aktif yang ditugaskan kepadamu.' : 'No active tasks assigned to you yet.'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {id ? 'Tugas akan muncul di sini setelah manager menugaskannya.' : 'Tasks will appear here once your manager assigns them.'}
          </p>
        </div>
      ) : taskView === 'kanban' ? (
        <KanbanBoard
          tasks={activeTasks}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
          changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
          userRole={user?.role}
        />
      ) : (
        <TaskTable
          tasks={activeTasks}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
          changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
          showProject
          userRole={user?.role}
        />
      )}

      {/* Tugas Selesai Hari Ini */}
      {todayDoneTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {id ? 'Tugas Selesai Hari Ini' : 'Tasks Completed Today'}
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {todayDoneTasks.length}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {todayDoneTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors"
                >
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 line-through truncate">{task.name}</p>
                    {task.project_name && (
                      <p className="text-xs text-gray-400 truncate">{task.project_name}</p>
                    )}
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{task.due_date.split('T')[0]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
