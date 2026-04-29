import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import type { HealthStatus, ProjectStatus } from '../types';

function HealthBadge({ status, language }: { status?: HealthStatus | null; language: string }) {
  if (!status) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
        {language === 'id' ? 'Tidak ada data' : 'No data'}
      </span>
    );
  }
  const config: Record<string, { bg: string; text: string; labelId: string; labelEn: string }> = {
    green: { bg: 'bg-green-100', text: 'text-green-700', labelId: 'Baik', labelEn: 'On Track' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', labelId: 'Waspada', labelEn: 'Warning' },
    red:   { bg: 'bg-red-100',   text: 'text-red-700',   labelId: 'Kritis',  labelEn: 'Critical' },
  };
  const c = config[status] ?? config.green;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.bg} ${c.text} font-medium`}>
      {language === 'id' ? c.labelId : c.labelEn}
    </span>
  );
}

function ProjectStatusBadge({ status, language }: { status: ProjectStatus; language: string }) {
  const config: Record<ProjectStatus, { bg: string; text: string; labelId: string; labelEn: string }> = {
    active:    { bg: 'bg-blue-100',  text: 'text-blue-700',  labelId: 'Aktif',     labelEn: 'Active' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', labelId: 'Selesai',   labelEn: 'Completed' },
    'on-hold': { bg: 'bg-amber-100', text: 'text-amber-700', labelId: 'Ditunda',   labelEn: 'On Hold' },
    cancelled: { bg: 'bg-red-100',   text: 'text-red-700',   labelId: 'Dibatalkan', labelEn: 'Cancelled' },
  };
  const c = config[status] ?? config.active;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.bg} ${c.text} font-medium`}>
      {language === 'id' ? c.labelId : c.labelEn}
    </span>
  );
}

type Tab = 'active' | 'completed';

export default function TechnicianProjectsPage() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const router = useRouter();
  const { language } = useLanguage();
  const id = language === 'id';
  const [activeTab, setActiveTab] = useState<Tab>('active');

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

  const completedProjects = data.completed_projects ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('nav.my_projects', language)}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {id ? 'Proyek yang ditugaskan kepadamu beserta detail klien' : 'Projects assigned to you with client details'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit" role="tablist" aria-label={id ? 'Tab proyek' : 'Project tabs'}>
        <button
          role="tab"
          aria-selected={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'active'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {id ? 'Aktif' : 'Active'} ({data.assigned_projects.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {id ? 'Riwayat' : 'History'} ({completedProjects.length})
        </button>
      </div>

      {/* Active projects tab */}
      {activeTab === 'active' && (
        <>
          {data.assigned_projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {id ? 'Belum ada proyek aktif yang ditugaskan.' : 'No active projects assigned to you.'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {id ? 'Minta manager untuk menugaskan kamu ke proyek.' : 'Ask your manager to assign you to a project.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.assigned_projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => router.push(`/projects/${proj.id}`)}
                  className="text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 p-5 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{proj.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        proj.phase === 'survey'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {proj.phase === 'survey' ? t('project.phase_survey', language) : t('project.phase_execution', language)}
                      </span>
                      <HealthBadge status={proj.health_status} language={language} />
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {proj.client_name ?? (id ? 'Belum ada klien' : 'No client assigned')}
                        </p>
                        {proj.client_address && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{proj.client_address}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task progress */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>
                      {id
                        ? `Tugas saya: ${proj.my_completed} dari ${proj.my_task_count} selesai`
                        : `My tasks: ${proj.my_completed} of ${proj.my_task_count} completed`}
                    </span>
                    <span className="font-medium">
                      {proj.my_task_count > 0 ? Math.round((proj.my_completed / proj.my_task_count) * 100) : 0}%
                    </span>
                  </div>
                  {proj.my_task_count > 0 && (
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
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
        </>
      )}

      {/* Completed/History tab */}
      {activeTab === 'completed' && (
        <>
          {completedProjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {id ? 'Belum ada proyek yang selesai.' : 'No completed projects yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedProjects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => router.push(`/projects/${proj.id}`)}
                  className="text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-5 transition-all opacity-75 hover:opacity-100"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400">{proj.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <ProjectStatusBadge status={proj.status} language={language} />
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {proj.client_name ?? (id ? 'Belum ada klien' : 'No client assigned')}
                        </p>
                        {proj.client_address && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{proj.client_address}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Final task count */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>
                      {id
                        ? `Tugas: ${proj.my_completed}/${proj.my_task_count} selesai`
                        : `Tasks: ${proj.my_completed}/${proj.my_task_count} completed`}
                    </span>
                    <span className="font-medium">
                      {proj.my_task_count > 0 ? Math.round((proj.my_completed / proj.my_task_count) * 100) : 0}%
                    </span>
                  </div>
                  {proj.my_task_count > 0 && (
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full transition-all"
                        style={{ width: `${(proj.my_completed / proj.my_task_count) * 100}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
