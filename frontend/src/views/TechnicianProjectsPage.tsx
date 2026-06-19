'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { useChangeTaskStatus } from '../hooks/useTasks';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import type { Language } from '../hooks/useLanguage';
import type { HealthStatus, ProjectStatus, Task, TaskStatus } from '../types';

// ---- helpers ----

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

type UrgencyLevel = 'critical' | 'warning' | 'ok';

function getUrgency(health?: string | null, endDate?: string): UrgencyLevel {
  const days = endDate ? daysUntil(endDate) : 999;
  if (health === 'red' || days <= 0) return 'critical';
  if (health === 'amber' || days <= 7) return 'warning';
  return 'ok';
}

const urgencyOrder: Record<UrgencyLevel, number> = { critical: 0, warning: 1, ok: 2 };

const urgencyBorder: Record<UrgencyLevel, string> = {
  critical: 'border-l-4 border-l-red-500',
  warning: 'border-l-4 border-l-amber-500',
  ok: 'border-l-4 border-l-green-500',
};

const urgencyDot: Record<UrgencyLevel, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  ok: 'bg-green-500',
};

// ---- "new item" badge ----

function NewBadge() {
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white animate-pulse shrink-0">
      BARU
    </span>
  );
}

// ---- small components ----

function CountdownChip({ endDate, language }: { endDate?: string; language: Language }) {
  if (!endDate) return null;
  const days = daysUntil(endDate);
  const id = language === 'id';
  if (days === 0) {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{id ? 'Hari ini!' : 'Hari ini!'}</span>;
  }
  if (days < 0) {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{Math.abs(days)} {id ? 'hari terlambat' : 'hari terlambat'}</span>;
  }
  if (days <= 7) {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{days} {id ? 'hari lagi' : 'hari lagi'}</span>;
  }
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{days} {id ? 'hari lagi' : 'hari lagi'}</span>;
}

const ClipboardIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const WrenchIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

function PhaseBadge({ phase, language }: { phase: string; language: Language }) {
  const id = language === 'id';
  if (phase === 'survey') return <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"><ClipboardIcon />{id ? 'Survei' : t('project.phase_survey', language)}</span>;
  return <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><WrenchIcon />{id ? 'Proyek' : t('project.phase_execution', language)}</span>;
}

function HealthBadge({ status }: { status?: HealthStatus | null }) {
  if (!status) return null;
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    green: { bg: 'bg-green-100', text: 'text-green-700', label: 'Baik' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Waspada' },
    red:   { bg: 'bg-red-100',   text: 'text-red-700',   label: 'Kritis' },
  };
  const c = cfg[status] ?? cfg.green;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

function ProjectStatusBadge({ status, language }: { status: ProjectStatus; language: Language }) {
  const id = language === 'id';
  const cfg: Record<ProjectStatus, { bg: string; text: string; labelId: string; labelEn: string }> = {
    active:    { bg: 'bg-blue-100',  text: 'text-blue-700',  labelId: 'Aktif',     labelEn: 'Aktif' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', labelId: 'Selesai',   labelEn: 'Selesai' },
    'on-hold': { bg: 'bg-amber-100', text: 'text-amber-700', labelId: 'Ditunda',   labelEn: 'Ditunda' },
    cancelled: { bg: 'bg-red-100',   text: 'text-red-700',   labelId: 'Dibatalkan', labelEn: 'Dibatalkan' },
  };
  const c = cfg[status] ?? cfg.active;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{id ? c.labelId : c.labelEn}</span>;
}

function StatusChip({ status }: { status: TaskStatus }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    to_do:        { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Belum' },
    working_on_it:{ bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Dikerjakan' },
    in_progress:  { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Dikerjakan' },
    review:       { bg: 'bg-purple-100',text: 'text-purple-700',label: 'Tinjauan' },
    done:         { bg: 'bg-green-100', text: 'text-green-700', label: 'Selesai' },
  };
  const c = cfg[status] ?? cfg.to_do;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

// ---- task panel ----

interface TaskPanelProps {
  tasks: Task[];
  projId: number;
  language: Language;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  changingTaskId?: number;
  router: ReturnType<typeof useRouter>;
  isNew: (createdAt?: string) => boolean;
}

function TaskPanel({ tasks, projId, language, onStatusChange, changingTaskId, router, isNew }: TaskPanelProps) {
  const id = language === 'id';
  const doneIds = useMemo(() => new Set(tasks.filter(t => t.status === 'done').map(t => t.id)), [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
        {id ? 'Belum ada tugas yang ditugaskan kepada Anda di proyek ini.' : 'Belum ada tugas yang ditugaskan kepada Anda di proyek ini.'}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {tasks.map(task => {
          const isBlocked = task.depends_on != null && !doneIds.has(task.depends_on);
          const isOverdue = task.due_date ? daysUntil(task.due_date) < 0 : false;
          const isBusy = changingTaskId === task.id;
          return (
            <div key={task.id} className={`flex items-center gap-3 px-6 py-2.5 text-xs ${isNew(task.created_at) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
              <span className="text-gray-300 dark:text-gray-600 w-4 shrink-0 text-center font-mono">{task.sort_order}</span>
              <span className={`flex-1 min-w-0 truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {task.name}
              </span>
              {isNew(task.created_at) && <NewBadge />}
              <StatusChip status={task.status} />
              {task.due_date && (
                <span className={`shrink-0 hidden sm:inline ${isOverdue && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {task.due_date.split('T')[0]}
                </span>
              )}
              <div className="shrink-0">
                {task.status === 'done' ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : task.status === 'review' ? (
                  <span className="text-gray-400 italic text-[10px]">{id ? 'Menunggu' : 'Menunggu'}</span>
                ) : isBlocked ? (
                  <span title={task.depends_on_name ? `Menunggu: ${task.depends_on_name}` : 'Diblokir'}>
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                ) : (task.status === 'to_do') ? (
                  <button
                    disabled={isBusy}
                    onClick={() => onStatusChange(task.id, 'working_on_it')}
                    className="text-[10px] font-medium px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {id ? 'Mulai' : 'Mulai'}
                  </button>
                ) : (
                  <button
                    disabled={isBusy}
                    onClick={() => onStatusChange(task.id, 'review')}
                    className="text-[10px] font-medium px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {id ? 'Kirim' : 'Kirim'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => router.push(`/projects/${projId}`)}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          {id ? 'Lihat Detail Proyek' : 'Lihat Detail Proyek'} {'→'}
        </button>
      </div>
    </div>
  );
}

// ---- types ----

type TabKey = 'survey' | 'execution' | 'history';
type ViewMode = 'grid' | 'list';

// ---- main component ----

export default function TechnicianProjectsPage() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const router = useRouter();
  const { language } = useLanguage();
  const changeStatus = useChangeTaskStatus();
  const id = language === 'id';
  const locale = id ? 'id-ID' : 'en-US';

  // "New item" — track last seen timestamp in localStorage
  const SEEN_KEY = 'tech_projects_last_seen';
  const lastSeenRef = useRef<Date>(new Date(0));
  useEffect(() => {
    const stored = localStorage.getItem(SEEN_KEY);
    lastSeenRef.current = stored ? new Date(stored) : new Date(0);
    // After 5s update the key so items are no longer "new" on next visit
    const t = setTimeout(() => localStorage.setItem(SEEN_KEY, new Date().toISOString()), 5000);
    return () => clearTimeout(t);
  }, []);
  function isNew(createdAt?: string): boolean {
    if (!createdAt) return false;
    return new Date(createdAt) > lastSeenRef.current;
  }

  const surveyProjects = useMemo(() => (data?.assigned_projects ?? []).filter(p => p.phase === 'survey'), [data]);
  const defaultTab: TabKey = surveyProjects.length > 0 ? 'survey' : 'execution';

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const tasksByProject = useMemo<Map<number, Task[]>>(() => {
    const map = new Map<number, Task[]>();
    for (const task of data?.recent_tasks ?? []) {
      const arr = map.get(task.project_id) ?? [];
      arr.push(task);
      map.set(task.project_id, arr);
    }
    for (const [pid, tasks] of map.entries()) {
      map.set(pid, [...tasks].sort((a, b) => a.sort_order - b.sort_order));
    }
    return map;
  }, [data]);

  const changingTaskId = changeStatus.isPending ? changeStatus.variables?.id : undefined;

  function sortByUrgency<T extends { health_status?: HealthStatus | null; end_date?: string; created_at?: string }>(arr: T[]): T[] {
    return [...arr].sort((a, b) => {
      const aN = isNew(a.created_at);
      const bN = isNew(b.created_at);
      if (aN && !bN) return -1;
      if (!aN && bN) return 1;
      const ua = urgencyOrder[getUrgency(a.health_status, a.end_date)];
      const ub = urgencyOrder[getUrgency(b.health_status, b.end_date)];
      if (ua !== ub) return ua - ub;
      const da = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const db = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return da - db;
    });
  }

  const today = useMemo(() => new Date().toDateString(), []);
  function isToday(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === today;
  }

  const surveyList = useMemo(() => sortByUrgency(surveyProjects), [surveyProjects]);
  const executionList = useMemo(() => sortByUrgency((data?.assigned_projects ?? []).filter(p => p.phase === 'execution')), [data]);
  const historyList = data?.completed_projects ?? [];
  const completedTodayProjects = useMemo(
    () => (data?.completed_projects ?? []).filter(p => p.status === 'completed' && isToday(p.updated_at)),
    [data, today]
  );

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

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'survey',    label: id ? 'Survei'   : 'Survei',    count: surveyList.length },
    { key: 'execution', label: id ? 'Proyek' : 'Proyek', count: executionList.length },
    { key: 'history',   label: id ? 'Riwayat'  : 'Riwayat',   count: historyList.length },
  ];

  const currentList = activeTab === 'survey' ? surveyList : activeTab === 'execution' ? executionList : historyList;

  function handleStatusChange(taskId: number, status: TaskStatus, projId: number) {
    changeStatus.mutate({ id: taskId, status, projectId: projId });
  }

  // ---- grid card ----
  function GridCard<T extends typeof currentList[number]>(proj: T, idx: number) {
    const isHistory = activeTab === 'history';
    if (isHistory) {
      const hp = proj as typeof historyList[number];
      const pct = hp.my_task_count > 0 ? Math.round((hp.my_completed / hp.my_task_count) * 100) : 0;
      return (
        <button
          key={hp.id}
          onClick={() => router.push(`/projects/${hp.id}`)}
          className="text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-sm transition-all opacity-80 hover:opacity-100"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-gray-300 font-bold">#{idx + 1}</span>
            <ProjectStatusBadge status={hp.status} language={language} />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 truncate">{hp.name}</p>
          <p className="text-xs text-gray-400 mb-3 truncate">{hp.client_name ?? '--'}</p>
          {hp.end_date && <p className="text-xs text-gray-400 mb-2">{id ? 'Selesai:' : 'Selesai:'} {formatDate(hp.end_date, locale)}</p>}
          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{hp.my_completed}/{hp.my_task_count}</span><span>{pct}%</span></div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full bg-gray-400 rounded-full" style={{ width: `${pct}%` }} /></div>
        </button>
      );
    }

    const ap = proj as typeof surveyList[number];
    const urgency = getUrgency(ap.health_status, ap.end_date);
    const pct = ap.my_task_count > 0 ? Math.round((ap.my_completed / ap.my_task_count) * 100) : 0;
    const isSurvey = ap.phase === 'survey';
    const itemIsNew = isNew(ap.created_at);
    const nextBox = ap.next_task_name
      ? <p className={`text-xs px-2 py-1 rounded truncate ${isSurvey ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{ap.next_task_name}</p>
      : ap.my_task_count === 0
        ? <p className="text-xs text-gray-400 italic">{id ? 'Belum ada tugas' : 'Belum ada tugas'}</p>
        : <p className="text-xs text-gray-400 italic">{id ? 'Semua tugas selesai' : 'Semua tugas selesai'}</p>;

    return (
      <button
        key={ap.id}
        onClick={() => router.push(`/projects/${ap.id}`)}
        className={`text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-sm transition-all ${urgencyBorder[urgency]} ${itemIsNew ? 'ring-2 ring-blue-400/40' : ''}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSurvey ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>#{idx + 1}</span>
            <PhaseBadge phase={ap.phase} language={language} />
            {itemIsNew && <NewBadge />}
          </div>
          <CountdownChip endDate={ap.end_date} language={language} />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5 truncate">{ap.name}</p>
        <p className="text-xs text-gray-400 mb-3 truncate">{ap.client_name ?? '--'}</p>
        <div className="mb-3">
          <p className="text-[10px] text-gray-400 mb-1">{id ? 'Tugas berikutnya:' : 'Tugas berikutnya:'}</p>
          {nextBox}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{ap.my_completed}/{ap.my_task_count} {id ? 'selesai' : 'selesai'}</span><span>{pct}%</span></div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} /></div>
      </button>
    );
  }

  // ---- list view ----
  function ListRow<T extends typeof currentList[number]>(proj: T, idx: number) {
    const isHistory = activeTab === 'history';
    if (isHistory) {
      const hp = proj as typeof historyList[number];
      const pct = hp.my_task_count > 0 ? Math.round((hp.my_completed / hp.my_task_count) * 100) : 0;
      return (
        <button
          key={hp.id}
          onClick={() => router.push(`/projects/${hp.id}`)}
          className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors opacity-80 hover:opacity-100"
        >
          <span className="text-sm font-bold text-gray-300 w-6 shrink-0 text-center">#{idx + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{hp.name}</p>
            <p className="text-xs text-gray-400 truncate">{hp.client_name ?? '--'}</p>
          </div>
          <ProjectStatusBadge status={hp.status} language={language} />
          <div className="text-right shrink-0 w-28 hidden sm:block">
            <p className="text-[10px] text-gray-400 mb-0.5">{id ? 'Selesai' : 'Selesai'}</p>
            <span className="text-xs text-gray-500">{hp.end_date ? formatDate(hp.end_date, locale) : '--'}</span>
          </div>
          <div className="w-24 shrink-0 hidden md:block">
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{hp.my_completed}/{hp.my_task_count}</span><span>{pct}%</span></div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full bg-gray-400 rounded-full" style={{ width: `${pct}%` }} /></div>
          </div>
        </button>
      );
    }

    const ap = proj as typeof surveyList[number];
    const urgency = getUrgency(ap.health_status, ap.end_date);
    const pct = ap.my_task_count > 0 ? Math.round((ap.my_completed / ap.my_task_count) * 100) : 0;
    const isExpanded = expandedId === ap.id;
    const projectTasks = tasksByProject.get(ap.id) ?? [];
    const itemIsNew = isNew(ap.created_at);

    return (
      <div key={ap.id} className={`${urgencyBorder[urgency]} ${itemIsNew ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}>
        <button
          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : ap.id)}
          aria-expanded={isExpanded}
        >
          <span className="text-sm font-bold text-gray-300 dark:text-gray-600 w-6 shrink-0 text-center">#{idx + 1}</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyDot[urgency]}`} aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{ap.name}</p>
              {itemIsNew && <NewBadge />}
            </div>
            <p className="text-xs text-gray-400 truncate">{ap.client_name ?? '--'}</p>
            {!isExpanded && ap.next_task_name && (
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{ap.next_task_name}</p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <PhaseBadge phase={ap.phase} language={language} />
            <HealthBadge status={ap.health_status} />
          </div>
          <CountdownChip endDate={ap.end_date} language={language} />
          <div className="w-24 shrink-0 hidden md:block">
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{ap.my_completed}/{ap.my_task_count}</span><span>{pct}%</span></div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} /></div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {isExpanded && (
          <TaskPanel
            tasks={projectTasks}
            projId={ap.id}
            language={language}
            onStatusChange={(taskId, status) => handleStatusChange(taskId, status, ap.id)}
            changingTaskId={changingTaskId}
            router={router}
            isNew={isNew}
          />
        )}
      </div>
    );
  }

  const isEmpty = currentList.length === 0;
  const emptyMsg = activeTab === 'survey'
    ? (id ? 'Belum ada proyek survei.' : 'Belum ada proyek survei.')
    : activeTab === 'execution'
      ? (id ? 'Belum ada proyek.' : 'Belum ada proyek.')
      : (id ? 'Belum ada riwayat proyek.' : 'Belum ada riwayat proyek.');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('nav.my_projects', language)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {id ? 'Proyek yang ditugaskan kepada Anda beserta detail klien' : 'Proyek yang ditugaskan kepada Anda beserta detail klien'}
          </p>
        </div>
        <div
          className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shrink-0"
          role="group"
          aria-label={id ? 'Mode Tampilan' : 'Mode Tampilan'}
        >
          {(['grid', 'list'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)} aria-pressed={viewMode === m}
              title={m === 'grid' ? (id ? 'Tampilan grid' : 'Tampilan grid') : (id ? 'Tampilan daftar' : 'Tampilan daftar')}
              className={`p-1.5 rounded-md transition-all ${viewMode === m ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {m === 'grid'
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMsg}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((proj, idx) => GridCard(proj, idx))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs text-gray-500">
            {currentList.length} {id ? 'proyek' : 'proyek'}
            {activeTab !== 'history' ? (id ? ' — diurutkan berdasarkan urgensi' : ' — diurutkan berdasarkan urgensi') : ''}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {currentList.map((proj, idx) => ListRow(proj, idx))}
          </div>
        </div>
      )}

      {/* Proyek Selesai Hari Ini */}
      {completedTodayProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {id ? 'Proyek Selesai Hari Ini' : 'Proyek Selesai Hari Ini'}
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {completedTodayProjects.length}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {completedTodayProjects.map((proj) => {
                const pct = proj.my_task_count > 0 ? Math.round((proj.my_completed / proj.my_task_count) * 100) : 100;
                return (
                  <button
                    key={proj.id}
                    onClick={() => router.push(`/projects/${proj.id}`)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors"
                  >
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{proj.name}</p>
                      <p className="text-xs text-gray-400 truncate">{proj.client_name ?? '--'}</p>
                    </div>
                    <PhaseBadge phase={proj.phase} language={language} />
                    <div className="w-24 shrink-0 hidden md:block">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{proj.my_completed}/{proj.my_task_count}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
