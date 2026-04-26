import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { useEscalationSummary } from '../../hooks/useEscalations';
import GlobalSearchBar from './GlobalSearchBar';
import NotificationBell from './NotificationBell';
import { t } from '../../lib/i18n';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

function DashboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function EscalationsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function TechniciansIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.657-5.657a8 8 0 1111.314 0l-5.657 5.657zm0 0L9 19l-2.12-2.12M12.5 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Layout({ children }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle, isDark } = useTheme();
  const { language, toggle: toggleLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: escalationSummary } = useEscalationSummary();
  const openEscalations = escalationSummary?.open ?? 0;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const navItems: NavItem[] = isManager
    ? [
        { to: '/dashboard', label: t('nav.dashboard', language), icon: <DashboardIcon /> },
        { to: '/projects', label: t('nav.projects', language), icon: <ProjectsIcon /> },
        { to: '/schedule', label: t('nav.schedule', language), icon: <ScheduleIcon /> },
        { to: '/timeline', label: t('nav.timeline', language), icon: <TimelineIcon /> },
        { to: '/clients', label: t('nav.clients', language), icon: <ClientsIcon /> },
        { to: '/reports', label: t('nav.reports', language), icon: <ReportsIcon /> },
        { to: '/escalations', label: t('nav.escalations', language), icon: <EscalationsIcon />, badge: openEscalations },
        ...(user?.role === 'admin'
          ? [
              { to: '/technicians', label: t('nav.technicians', language), icon: <TechniciansIcon /> },
              { to: '/users', label: t('nav.users', language), icon: <UsersIcon /> },
              { to: '/audit-log', label: t('nav.audit_log', language), icon: <AuditIcon /> },
            ]
          : []),
      ]
    : [
        { to: '/my-dashboard', label: t('nav.my_dashboard', language), icon: <DashboardIcon /> },
        { to: '/my-projects', label: t('nav.my_projects', language), icon: <ProjectsIcon /> },
        { to: '/my-tasks', label: t('nav.my_tasks', language), icon: <TasksIcon /> },
        { to: '/my-escalations', label: t('nav.my_escalations', language), icon: <EscalationsIcon />, badge: openEscalations },
      ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-slate-900 transform transition-transform duration-200 lg:translate-x-0 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="px-4 py-4 border-b border-slate-800 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">SHI</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">SHI Dashboard</p>
                <p className="text-slate-400 text-[10px]">Smart Home Inovasi</p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge != null && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" aria-label={`${item.badge} open`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

          </nav>

          {/* User info + logout */}
          <div className="px-3 py-4 border-t border-slate-800 dark:border-gray-800">
            <Link
              href="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 mb-3 hover:bg-slate-800 rounded-lg px-1 py-1 -mx-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                <p className="text-slate-400 text-[10px] capitalize">{user?.role}</p>
              </div>
            </Link>
            {/* Theme + language row */}
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={toggle}
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {isDark ? t('settings.theme_light', language) : t('settings.theme_dark', language)}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700 hover:border-slate-600 min-w-[32px]"
                aria-label={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
                title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
              >
                {language === 'id' ? 'ID' : 'EN'}
              </button>
            </div>
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === '/settings'
                  ? 'text-white bg-slate-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SettingsIcon />
              {t('nav.settings', language)}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('nav.logout', language)}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56">
        {/* Top bar (mobile menu + breadcrumb) */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between h-12 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden lg:flex flex-1 justify-center px-4">
              <GlobalSearchBar />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Reload page"
                title="Reload page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{now.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{now.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              {isManager && <NotificationBell />}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{user?.name}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
