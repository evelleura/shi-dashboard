'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DashboardPage from '@/views/DashboardPage';
import ProjectsPage from '@/views/ProjectsPage';
import ProjectDetailPage from '@/views/ProjectDetailPage';
import ClientsPage from '@/views/ClientsPage';
import ClientDetailPage from '@/views/ClientDetailPage';
import EscalationsPage from '@/views/EscalationsPage';
import TechnicianDashboard from '@/views/TechnicianDashboard';
import TechnicianProjectsPage from '@/views/TechnicianProjectsPage';
import TechnicianTasksPage from '@/views/TechnicianTasksPage';
import TechnicianEscalationsPage from '@/views/TechnicianEscalationsPage';
import AuditLogPage from '@/views/AuditLogPage';
import UserManagementPage from '@/views/UserManagementPage';
import TechnicianManagementPage from '@/views/TechnicianManagementPage';
import ProjectTimelinePage from '@/views/ProjectTimelinePage';
import SchedulePage from '@/views/SchedulePage';
import ReportsPage from '@/views/ReportsPage';
import ProfilePage from '@/views/ProfilePage';
import SettingsPage from '@/views/SettingsPage';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { canAccessRoute, roleHome } from '@/lib/rbac';
import { t } from '@/lib/i18n';

type Props = { params: Promise<{ slug: string[] }> };

function resolveView(section: string | undefined, id: string | undefined) {
  if (section === 'dashboard')          return <DashboardPage />;
  if (section === 'projects' && id)     return <ProjectDetailPage />;
  if (section === 'projects')           return <ProjectsPage />;
  if (section === 'clients' && id)      return <ClientDetailPage />;
  if (section === 'clients')            return <ClientsPage />;
  if (section === 'escalations')        return <EscalationsPage />;
  if (section === 'my-dashboard')       return <TechnicianDashboard />;
  if (section === 'my-projects')        return <TechnicianProjectsPage />;
  if (section === 'my-tasks')           return <TechnicianTasksPage />;
  if (section === 'my-escalations')     return <TechnicianEscalationsPage />;
  if (section === 'audit-log')          return <AuditLogPage />;
  if (section === 'users')              return <UserManagementPage />;
  if (section === 'technicians' && id)  return <TechnicianManagementPage defaultDetailId={parseInt(id)} />;
  if (section === 'technicians')        return <TechnicianManagementPage />;
  if (section === 'timeline')           return <ProjectTimelinePage />;
  if (section === 'schedule')           return <SchedulePage />;
  if (section === 'reports')            return <ReportsPage />;
  if (section === 'profile')            return <ProfilePage />;
  if (section === 'settings')           return <SettingsPage />;
  return null;
}

function Forbidden({ home }: { home: string }) {
  const { language } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center" role="alert">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('forbidden.title', language)}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{t('forbidden.message', language)}</p>
      <Link href={home} className="mt-5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
        {t('forbidden.back_home', language)}
      </Link>
    </div>
  );
}

export default function ProtectedPage({ params }: Props) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [section, id] = slug;

  const view = resolveView(section, id);
  if (!view) return notFound();

  // Gerbang rute terpusat: peran tanpa kapabilitas yang diwajibkan -> 403 panel.
  // PENGECUALIAN: DETAIL proyek (/projects/:id) boleh dilihat teknisi (view-only --
  // ProjectDetailPage menyembunyikan SEMUA aksi kelola via isManager; backend izinkan
  // user terautentikasi). Hanya LIST kelola (/projects) yang tetap digerbang manajer.
  // Tanpa ini, tautan teknisi (dashboard / my-projects) ke detail proyek kena 403 palsu.
  const isProjectDetail = section === 'projects' && !!id;
  if (user && !isProjectDetail && !canAccessRoute(user.role, section)) {
    return <Forbidden home={roleHome(user.role)} />;
  }

  return view;
}
