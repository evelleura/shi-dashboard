'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../../hooks/useDashboard';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import type { AppNotification } from '../../hooks/useNotifications';

// ── Manager-derived alerts (existing logic) ─────────────────────────────────

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'overtime' | 'escalation';
  title: string;
  detail: string;
  link: string;
}

const ALERT_STYLES: Record<string, { dot: string }> = {
  critical:   { dot: 'bg-red-500' },
  warning:    { dot: 'bg-amber-400' },
  overtime:   { dot: 'bg-orange-500' },
  escalation: { dot: 'bg-red-600' },
};

const NOTIF_TYPE_STYLES: Record<string, { dot: string; label: string }> = {
  task_assigned:    { dot: 'bg-blue-500',   label: 'Tugas' },
  project_assigned: { dot: 'bg-purple-500', label: 'Proyek' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Baru saja';
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hr lalu`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const { data: dashData } = useDashboard();
  const { data: notifData } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Mark all read when dropdown opens
  useEffect(() => {
    if (open && (notifData?.unread ?? 0) > 0) {
      markAll.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const managerAlerts = useMemo<Alert[]>(() => {
    if (!isManager || !dashData) return [];
    const list: Alert[] = [];
    for (const p of dashData.projects) {
      if (p.health_status === 'red') {
        list.push({ id: `crit-${p.id}`, type: 'critical', title: `${p.name} — Kritis`, detail: `SPI ${p.spi_value != null ? Number(p.spi_value).toFixed(2) : 'N/A'} — di bawah target`, link: `/projects/${p.id}` });
      }
    }
    for (const p of dashData.projects) {
      if (p.health_status === 'amber') {
        list.push({ id: `warn-${p.id}`, type: 'warning', title: `${p.name} — Waspada`, detail: `SPI ${p.spi_value != null ? Number(p.spi_value).toFixed(2) : 'N/A'} — perlu perhatian`, link: `/projects/${p.id}` });
      }
    }
    if (dashData.summary.overtime_tasks > 0) {
      list.push({ id: 'overtime', type: 'overtime', title: `${dashData.summary.overtime_tasks} Tugas Overtime`, detail: 'Tugas melewati tenggat masih dikerjakan', link: '/projects' });
    }
    if ((dashData.summary.open_escalations ?? 0) > 0) {
      list.push({ id: 'escalations', type: 'escalation', title: `${dashData.summary.open_escalations} Eskalasi Terbuka`, detail: 'Membutuhkan perhatian segera', link: '/escalations' });
    }
    return list;
  }, [isManager, dashData]);

  const notifications: AppNotification[] = notifData?.notifications ?? [];
  const unreadCount = (notifData?.unread ?? 0) + (isManager ? managerAlerts.length : 0);

  function handleNotifClick(n: AppNotification) {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.entity_type === 'task' && n.project_id) router.push(`/projects/${n.project_id}`);
    else if (n.entity_type === 'project' && n.entity_id) router.push(`/projects/${n.entity_id}`);
    setOpen(false);
  }

  const totalCount = managerAlerts.length + notifications.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={`${unreadCount} notifikasi`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifikasi</h3>
            {notifications.length > 0 && (
              <button onClick={() => markAll.mutate()} className="text-[11px] text-blue-600 hover:underline">Tandai semua dibaca</button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {totalCount === 0 ? (
              <div className="py-8 text-center">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-400 dark:text-gray-500">Tidak ada notifikasi</p>
              </div>
            ) : (
              <>
                {/* Real notifications */}
                {notifications.map((n) => {
                  const style = NOTIF_TYPE_STYLES[n.type] ?? { dot: 'bg-gray-400', label: '' };
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${!n.is_read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                          {n.body && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                      </div>
                    </button>
                  );
                })}

                {/* Manager-only system alerts */}
                {managerAlerts.map((a) => {
                  const style = ALERT_STYLES[a.type];
                  return (
                    <button
                      key={a.id}
                      onClick={() => { router.push(a.link); setOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{a.title}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{a.detail}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Sistem</p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
