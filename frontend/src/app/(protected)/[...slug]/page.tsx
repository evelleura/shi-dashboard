'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import DashboardPage from '@/views/DashboardPage';
import ProjectsPage from '@/views/ProjectsPage';
import ProjectDetailPage from '@/views/ProjectDetailPage';
import ClientsPage from '@/views/ClientsPage';
import EscalationsPage from '@/views/EscalationsPage';
import TechnicianDashboard from '@/views/TechnicianDashboard';
import TechnicianProjectsPage from '@/views/TechnicianProjectsPage';
import TechnicianTasksPage from '@/views/TechnicianTasksPage';
import TechnicianEscalationsPage from '@/views/TechnicianEscalationsPage';
import AuditLogPage from '@/views/AuditLogPage';
import UserManagementPage from '@/views/UserManagementPage';
import ProjectTimelinePage from '@/views/ProjectTimelinePage';
import ReportsPage from '@/views/ReportsPage';
import ProfilePage from '@/views/ProfilePage';

type Props = { params: Promise<{ slug: string[] }> };

export default function ProtectedPage({ params }: Props) {
  const { slug } = use(params);
  const [section, id] = slug;

  if (section === 'dashboard')     return <DashboardPage />;
  if (section === 'projects' && id) return <ProjectDetailPage />;
  if (section === 'projects')      return <ProjectsPage />;
  if (section === 'clients')       return <ClientsPage />;
  if (section === 'escalations')   return <EscalationsPage />;
  if (section === 'my-dashboard')  return <TechnicianDashboard />;
  if (section === 'my-projects')   return <TechnicianProjectsPage />;
  if (section === 'my-tasks')      return <TechnicianTasksPage />;
  if (section === 'my-escalations') return <TechnicianEscalationsPage />;
  if (section === 'audit-log')     return <AuditLogPage />;
  if (section === 'users')         return <UserManagementPage />;
  if (section === 'timeline')      return <ProjectTimelinePage />;
  if (section === 'reports')       return <ReportsPage />;
  if (section === 'profile')       return <ProfilePage />;

  return notFound();
}
