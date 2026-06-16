'use client';

import Link from 'next/link';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';

function TasksIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function EscalationIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

export default function TechQuickActionsBar() {
  const { language } = useLanguage();

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="toolbar"
      aria-label={t('nav.my_tasks', language)}
    >
      <Link
        href="/my-tasks"
        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={t('nav.my_tasks', language)}
      >
        <TasksIcon />
        {t('nav.my_tasks', language)}
      </Link>

      <Link
        href="/my-projects"
        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        aria-label={t('nav.my_projects', language)}
      >
        <ProjectsIcon />
        {t('nav.my_projects', language)}
      </Link>

      <Link
        href="/my-escalations"
        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
        aria-label={t('nav.my_escalations', language)}
      >
        <EscalationIcon />
        {t('nav.my_escalations', language)}
      </Link>
    </div>
  );
}
