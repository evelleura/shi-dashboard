import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useAssignTechnician, useUnassignTechnician } from '../hooks/useProjects';
import { useChangeTaskStatus, useCreateTask } from '../hooks/useTasks';
import { useStartTimer, useStopTimer } from '../hooks/useActivities';
import { useTechnicians } from '../hooks/useDashboard';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import TaskForm from '../components/tasks/TaskForm';
import ViewToggle from '../components/tasks/ViewToggle';
import MaterialsList from '../components/projects/MaterialsList';
import BudgetTable from '../components/projects/BudgetTable';
import EarnedValueChart from '../components/charts/EarnedValueChart';
import EvidenceGallery from '../components/evidence/EvidenceGallery';
import EvidenceUploader from '../components/evidence/EvidenceUploader';
import { formatTimeSpent } from '../components/tasks/TaskTimer';
import type { Task, TaskStatus, CreateTaskData } from '../types';
import { useAuth } from '../hooks/useAuth';

type TabId = 'tasks' | 'budget' | 'materials' | 'evidence' | 'charts';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ActiveTaskBanner({ task, onStop, isLoading }: { task: Task; onStop: () => void; isLoading: boolean }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-green-600 font-medium">Currently working on</p>
        <p className="text-sm font-semibold text-green-900 truncate">{task.name}</p>
      </div>
      <p className="text-lg font-mono font-bold text-green-700">{formatTimeSpent(Number(task.time_spent_seconds) || 0)}</p>
      <button
        onClick={onStop}
        disabled={isLoading}
        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
        aria-label="Stop timer"
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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id ?? '0');
  const { data: project, isLoading, isError } = useProject(projectId);
  const { data: technicians = [] } = useTechnicians();
  const { user } = useAuth();
  const changeStatus = useChangeTaskStatus();
  const createTask = useCreateTask();
  const assignTech = useAssignTechnician();
  const unassignTech = useUnassignTechnician();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const [taskView, setTaskView] = useState<'kanban' | 'table'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');


  const userRole = user?.role;
  const isManager = userRole === 'manager' || userRole === 'admin';
  const isTechnician = userRole === 'technician';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Project not found.</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-blue-600 text-sm underline">Go Back</button>
      </div>
    );
  }

  const handleStatusChange = (taskId: number, status: TaskStatus) => {
    changeStatus.mutate({ id: taskId, status, projectId });
  };

  const handleCreateTask = async (data: CreateTaskData) => {
    await createTask.mutateAsync(data);
    setShowTaskForm(false);
  };

  const handleAssign = async () => {
    if (!assignUserId) return;
    await assignTech.mutateAsync({ projectId, userId: parseInt(assignUserId) });
    setAssignUserId('');
    setShowAssign(false);
  };

  // Timer handlers (same pattern as TechnicianTasksPage)
  const handleTimerStart = (taskId: number) => {
    startTimer.mutate({ taskId, projectId });
  };

  const handleTimerStop = (taskId: number) => {
    stopTimer.mutate({ taskId, projectId });
  };

  const timerLoadingId = startTimer.isPending
    ? startTimer.variables?.taskId
    : stopTimer.isPending
    ? stopTimer.variables?.taskId
    : undefined;

  // Find actively tracked task for the banner
  const activeTask = (project.tasks ?? []).find((t) => t.is_tracking);

  // Filter tabs based on role -- technicians should NOT see Budget
  const allTabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'tasks', label: 'Tasks', count: project.tasks?.length ?? 0 },
    { id: 'budget', label: 'Budget', count: project.budget_items?.length ?? 0 },
    { id: 'materials', label: 'Materials', count: project.materials?.length ?? 0 },
    { id: 'evidence', label: 'Evidence' },
    { id: 'charts', label: 'Charts' },
  ];
  const tabs = isTechnician ? allTabs.filter((t) => t.id !== 'budget') : allTabs;

  // Available technicians for assignment (not yet assigned)
  const assignedIds = new Set((project.assigned_technicians ?? []).map((t) => t.id));
  const availableTechs = technicians.filter((t) => !assignedIds.has(t.id));

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline mb-3 flex items-center gap-1"
          aria-label="Go back"
        >
          &larr; Back
        </button>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.client_name && (
              <p className="text-sm text-blue-500 mt-0.5">Client: {project.client_name}</p>
            )}
            {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(project.start_date)} -- {formatDate(project.end_date)} ({project.duration} days)
              &nbsp;| Phase: <span className="font-medium">{project.phase === 'survey' ? 'Survey' : 'Execution'}</span>
              {/* Hide project value from technicians */}
              {!isTechnician && Number(project.project_value) > 0 && (
                <> | Value: Rp {Number(project.project_value).toLocaleString('id-ID')}</>
              )}
            </p>
          </div>
          <StatusBadge status={project.health?.status ?? null} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'SPI', value: project.health?.spi_value != null ? Number(project.health.spi_value).toFixed(3) : '--', color: 'text-blue-600' },
          {
            label: 'Deviation',
            value: project.health?.deviation_percent != null ? `${project.health.deviation_percent >= 0 ? '+' : ''}${Number(project.health.deviation_percent).toFixed(1)}%` : '--',
            color: (project.health?.deviation_percent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600',
          },
          { label: 'Tasks Done', value: `${project.health?.completed_tasks ?? 0}/${project.health?.total_tasks ?? 0}`, color: 'text-gray-700' },
          { label: 'Overtime', value: project.health?.overtime_tasks ?? 0, color: (project.health?.overtime_tasks ?? 0) > 0 ? 'text-amber-600' : 'text-gray-600' },
          { label: 'Overdue', value: project.health?.overdue_tasks ?? 0, color: (project.health?.overdue_tasks ?? 0) > 0 ? 'text-orange-600' : 'text-gray-600' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400">{m.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <ProgressBar
          actual={project.health?.actual_progress ?? 0}
          planned={project.health?.planned_progress ?? 0}
        />
      </div>

      {/* Assigned technicians */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Assigned Technicians</h3>
          {isManager && (
            <button onClick={() => setShowAssign(!showAssign)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              {showAssign ? 'Cancel' : '+ Assign'}
            </button>
          )}
        </div>
        {showAssign && (
          <div className="flex gap-2 mb-3">
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select technician...</option>
              {availableTechs.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!assignUserId || assignTech.isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs px-3 py-1.5 rounded-md"
            >
              Assign
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {(project.assigned_technicians ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">No technicians assigned</p>
          ) : (
            project.assigned_technicians.map((tech) => (
              <span key={tech.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {tech.name}
                {isManager && (
                  <button
                    onClick={() => unassignTech.mutate({ projectId, userId: tech.id })}
                    className="text-blue-400 hover:text-red-500 ml-0.5"
                    aria-label={`Unassign ${tech.name}`}
                  >
                    x
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px" role="tablist" aria-label="Project detail tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Active task banner */}
            {activeTask && (
              <ActiveTaskBanner
                task={activeTask}
                onStop={() => handleTimerStop(activeTask.id)}
                isLoading={!!timerLoadingId}
              />
            )}

            <div className="flex items-center justify-between">
              <ViewToggle view={taskView} onChange={setTaskView} />
              {isManager && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + New Task
                </button>
              )}
            </div>
            {taskView === 'kanban' ? (
              <KanbanBoard
                tasks={project.tasks ?? []}
                onStatusChange={handleStatusChange}
                onTaskClick={setSelectedTask}
                onTimerStart={handleTimerStart}
                onTimerStop={handleTimerStop}
                changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
                timerLoadingId={timerLoadingId}
                userRole={userRole}
              />
            ) : (
              <TaskTable
                tasks={project.tasks ?? []}
                onStatusChange={handleStatusChange}
                onTaskClick={setSelectedTask}
                onTimerStart={handleTimerStart}
                onTimerStop={handleTimerStop}
                changingTaskId={changeStatus.isPending ? (changeStatus.variables?.id ?? undefined) : undefined}
                timerLoadingId={timerLoadingId}
                userRole={userRole}
              />
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <BudgetTable
              projectId={projectId}
              budgetItems={project.budget_items ?? []}
              canEdit={isManager}
            />
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <MaterialsList
              projectId={projectId}
              materials={project.materials ?? []}
              canEdit={isManager}
            />
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-4">
            {(project.tasks ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Create tasks first to upload evidence.</p>
            ) : (
              (project.tasks ?? []).map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                      <span className="text-xs text-gray-400">({t.evidence_count ?? 0} files)</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <EvidenceUploader taskId={t.id} />
                    <EvidenceGallery taskId={t.id} canDelete={isManager} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-4">
            <EarnedValueChart projectId={projectId} />
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
        isChanging={changeStatus.isPending}
        userRole={userRole}
      />

      {/* Create Task Modal */}
      <Modal open={showTaskForm} onClose={() => setShowTaskForm(false)} title="Create New Task" maxWidth="max-w-lg">
        <TaskForm
          projectId={projectId}
          technicians={technicians}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
          isPending={createTask.isPending}
        />
      </Modal>
    </div>
  );
}
