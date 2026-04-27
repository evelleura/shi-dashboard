import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject, useProjectTechnicians, useApproveSurvey, useRejectSurvey } from '../hooks/useProjects';
import { useChangeTaskStatus, useCreateTask } from '../hooks/useTasks';
import { useStartTimer, useStopTimer } from '../hooks/useActivities';
import { useTechnicianList } from '../hooks/useUsers';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import TaskForm from '../components/tasks/TaskForm';
import ViewToggle from '../components/tasks/ViewToggle';
import EarnedValueChart from '../components/charts/EarnedValueChart';
import EvidenceGallery from '../components/evidence/EvidenceGallery';
import EvidenceUploader from '../components/evidence/EvidenceUploader';
import { formatTimeSpent } from '../components/tasks/TaskTimer';
import EntityActivityTimeline from '../components/ui/EntityActivityTimeline';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import type { Task, TaskStatus, CreateTaskData } from '../types';
import { useAuth } from '../hooks/useAuth';

type TabId = 'tasks' | 'evidence' | 'charts' | 'history';

function formatDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

function ActiveTaskBanner({ task, onStop, isLoading, language }: { task: Task; onStop: () => void; isLoading: boolean; language: string }) {
  return (
    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-3">
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t('project.currently_working', language as Parameters<typeof t>[1])}</p>
        <p className="text-sm font-semibold text-green-900 dark:text-green-100 truncate">{task.name}</p>
      </div>
      <p className="text-lg font-mono font-bold text-green-700 dark:text-green-400">{formatTimeSpent(Number(task.time_spent_seconds) || 0)}</p>
      <button
        onClick={onStop}
        disabled={isLoading}
        className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
        aria-label="Stop timer"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        {t('project.stop', language as Parameters<typeof t>[1])}
      </button>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  // Route is /projects/[id] via [...slug] catch-all: slug = ['projects', id]
  const slug = params?.slug;
  const id = Array.isArray(slug) ? slug[1] : (params?.id as string | undefined);
  const router = useRouter();
  const { language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const projectId = parseInt(id ?? '0');
  const { data: project, isLoading, isError } = useProject(projectId);
  const { data: technicians = [] } = useTechnicianList();
  const { data: projectTechnicians = [] } = useProjectTechnicians(projectId);
  const { user } = useAuth();
  const changeStatus = useChangeTaskStatus();
  const createTask = useCreateTask();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const approveSurveyMutation = useApproveSurvey();
  const rejectSurveyMutation = useRejectSurvey();

  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const [taskView, setTaskView] = useState<'kanban' | 'table'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');


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
        <p className="text-red-500 text-sm">{t('project.not_found', language)}.</p>
        <button onClick={() => router.back()} className="mt-2 text-blue-600 text-sm underline">{t('project.go_back', language)}</button>
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

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'tasks', label: t('project.tab_tasks', language), count: project.tasks?.length ?? 0 },
    { id: 'evidence', label: t('project.tab_evidence', language) },
    { id: 'charts', label: t('project.tab_charts', language) },
    { id: 'history', label: t('project.tab_history', language) },
  ];

  const metrics = [
    { label: t('project.metric_spi', language), value: project.health?.spi_value != null ? Number(project.health.spi_value).toFixed(3) : '--', color: 'text-blue-600' },
    {
      label: t('project.metric_deviation', language),
      value: project.health?.deviation_percent != null ? `${project.health.deviation_percent >= 0 ? '+' : ''}${Number(project.health.deviation_percent).toFixed(1)}%` : '--',
      color: (project.health?.deviation_percent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600',
    },
    { label: t('project.metric_tasks_done', language), value: `${project.health?.completed_tasks ?? 0}/${project.health?.total_tasks ?? 0}`, color: 'text-gray-700' },
    { label: t('project.metric_overtime', language), value: project.health?.overtime_tasks ?? 0, color: (project.health?.overtime_tasks ?? 0) > 0 ? 'text-amber-600' : 'text-gray-600' },
    { label: t('project.metric_overdue', language), value: project.health?.overdue_tasks ?? 0, color: (project.health?.overdue_tasks ?? 0) > 0 ? 'text-orange-600' : 'text-gray-600' },
  ];

  const techMeta = Object.fromEntries(
    projectTechnicians.map((pt) => [pt.id, { busy_today: pt.busy_today, active_tasks: pt.active_tasks }])
  );

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline mb-3 flex items-center gap-1"
          aria-label={t('action.back', language)}
        >
          &larr; {t('action.back', language)}
        </button>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
            {project.client_name && (
              <p className="text-sm text-blue-500 dark:text-blue-400 mt-0.5">{t('project.client_label', language)} {project.client_name}</p>
            )}
            {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {formatDate(project.start_date, locale)} -- {formatDate(project.end_date, locale)} ({project.duration} {t('project.days_label', language)})
              &nbsp;| {t('project.phase_label', language)} <span className="font-medium">{project.phase === 'survey' ? t('project.phase_survey', language) : t('project.phase_execution', language)}</span>
              {/* Hide project value from technicians */}
              {!isTechnician && Number(project.project_value) > 0 && (
                <> | {t('project.value_label', language)} Rp {Number(project.project_value).toLocaleString(locale)}</>
              )}
            </p>
          </div>
          <StatusBadge status={project.health?.status ?? null} />
        </div>
      </div>

      {/* Survey Status Banner */}
      {project.phase === 'survey' && !project.survey_approved && isManager && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-600">
                  {t('project.fase_survey', language)}
                </span>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('project.survey_banner', language)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => approveSurveyMutation.mutate(project.id)}
                disabled={approveSurveyMutation.isPending || rejectSurveyMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('project.approve_survey', language)}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={approveSurveyMutation.isPending || rejectSurveyMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('project.reject_survey', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {project.phase === 'survey' && project.survey_approved && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t('project.survey_approved', language)}
            {project.survey_approved_at && (
              <span className="font-normal text-green-600 dark:text-green-400">
                &mdash; {t('project.survey_approved_on', language)} {new Date(project.survey_approved_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Reject Survey Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('project.survey_reject_title', language)}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('project.survey_reject_hint', language)}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={t('project.reject_reason', language)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('action.cancel', language)}
              </button>
              <button
                type="button"
                disabled={rejectSurveyMutation.isPending}
                onClick={() => {
                  rejectSurveyMutation.mutate(
                    { id: project.id, reason: rejectReason.trim() || undefined },
                    { onSuccess: () => { setShowRejectModal(false); setRejectReason(''); } }
                  );
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {rejectSurveyMutation.isPending ? t('project.survey_confirming', language) : t('project.survey_confirm_reject', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">{m.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <ProgressBar
          actual={project.health?.actual_progress ?? 0}
          planned={project.health?.planned_progress ?? 0}
        />
      </div>

      {/* Assigned technicians — derived from tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('project.assigned_technicians', language)}</h3>
        {projectTechnicians.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('project.no_technicians', language)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left pb-2 font-medium pr-3">Teknisi</th>
                  <th className="text-center pb-2 font-medium px-2">Total</th>
                  <th className="text-center pb-2 font-medium px-2">Selesai</th>
                  <th className="text-center pb-2 font-medium px-2">Aktif</th>
                  <th className="text-center pb-2 font-medium px-2">Terlambat</th>
                  <th className="text-center pb-2 font-medium px-2">Hari Ini</th>
                  <th className="text-left pb-2 font-medium pl-2">Deadline Terdekat</th>
                </tr>
              </thead>
              <tbody>
                {projectTechnicians.map((tech) => (
                  <tr
                    key={tech.id}
                    onClick={() => router.push(`/technicians/${tech.id}`)}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold shrink-0">
                          {tech.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{tech.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{tech.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-2 text-gray-700 dark:text-gray-300">{tech.total_tasks}</td>
                    <td className="text-center py-2.5 px-2 text-green-600 dark:text-green-400 font-medium">{tech.completed_tasks}</td>
                    <td className="text-center py-2.5 px-2 text-blue-600 dark:text-blue-400">{tech.active_tasks}</td>
                    <td className="text-center py-2.5 px-2">
                      <span className={tech.overdue_tasks > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400 dark:text-gray-500'}>
                        {tech.overdue_tasks}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tech.busy_today
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      }`}>
                        {tech.busy_today ? 'Sibuk' : 'Bebas'}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-gray-600 dark:text-gray-400 text-xs">
                      {tech.earliest_due_date
                        ? new Date(tech.earliest_due_date).toLocaleDateString(locale, { day: '2-digit', month: 'short' })
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px" role="tablist" aria-label="Project detail tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({tab.count})</span>
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
                language={language}
              />
            )}

            <div className="flex items-center justify-between">
              <ViewToggle view={taskView} onChange={setTaskView} />
              {isManager && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t('project.new_task', language)}
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

        {activeTab === 'evidence' && (
          <div className="space-y-4">
            {(project.tasks ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">{t('project.tasks_first', language)}</p>
            ) : (
              (project.tasks ?? []).map((taskItem) => (
                <div key={taskItem.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{taskItem.name}</h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({taskItem.evidence_count ?? 0} files)</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <EvidenceUploader taskId={taskItem.id} />
                    <EvidenceGallery taskId={taskItem.id} canDelete={isManager} />
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

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('project.history', language)}</h3>
            <EntityActivityTimeline entityType="project" entityId={projectId} />
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
        existingTasks={project.tasks ?? []}
        technicians={technicians}
        projectId={projectId}
      />

      {/* Create Task Modal */}
      <Modal open={showTaskForm} onClose={() => setShowTaskForm(false)} title={t('task.new', language)} maxWidth="max-w-lg">
        <TaskForm
          projectId={projectId}
          technicians={technicians}
          technicianMeta={techMeta}
          existingTasks={project.tasks ?? []}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
          isPending={createTask.isPending}
          projectPhase={project.phase}
        />
      </Modal>
    </div>
  );
}
