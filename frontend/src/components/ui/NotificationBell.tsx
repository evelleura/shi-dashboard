import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../../hooks/useDashboard';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'overtime' | 'escalation';
  title: string;
  detail: string;
  link: string;
}

const TYPE_STYLES: Record<string, { dot: string; bg: string }> = {
  critical:   { dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  warning:    { dot: 'bg-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  overtime:   { dot: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  escalation: { dot: 'bg-red-600',    bg: 'bg-red-50 dark:bg-red-900/20' },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data } = useDashboard();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Build alerts from dashboard data
  const alerts: Alert[] = useMemo(() => {
    if (!data) return [];
    const list: Alert[] = [];

    // Critical projects (red health)
    for (const p of data.projects) {
      if (p.health_status === 'red') {
        list.push({
          id: `crit-${p.id}`,
          type: 'critical',
          title: `${p.name} - Critical`,
          detail: `SPI ${p.spi_value != null ? Number(p.spi_value).toFixed(2) : 'N/A'} — behind schedule`,
          link: `/projects/${p.id}`,
        });
      }
    }

    // Warning projects (amber)
    for (const p of data.projects) {
      if (p.health_status === 'amber') {
        list.push({
          id: `warn-${p.id}`,
          type: 'warning',
          title: `${p.name} - Warning`,
          detail: `SPI ${p.spi_value != null ? Number(p.spi_value).toFixed(2) : 'N/A'} — needs attention`,
          link: `/projects/${p.id}`,
        });
      }
    }

    // Overtime tasks
    if (data.summary.overtime_tasks > 0) {
      list.push({
        id: 'overtime',
        type: 'overtime',
        title: `${data.summary.overtime_tasks} Overtime Task${data.summary.overtime_tasks > 1 ? 's' : ''}`,
        detail: 'Tasks past due date still in progress',
        link: '/projects',
      });
    }

    // Open escalations
    if ((data.summary.open_escalations ?? 0) > 0) {
      list.push({
        id: 'escalations',
        type: 'escalation',
        title: `${data.summary.open_escalations} Open Escalation${(data.summary.open_escalations ?? 0) > 1 ? 's' : ''}`,
        detail: 'Require immediate attention',
        link: '/escalations',
      });
    }

    return list;
  }, [data]);

  const count = alerts.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={`${count} notifications`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 animate-pulse">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Alerts</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">{count} active</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-400 dark:text-gray-500">All clear — no alerts</p>
              </div>
            ) : (
              alerts.map((a) => {
                const style = TYPE_STYLES[a.type];
                return (
                  <button
                    key={a.id}
                    onClick={() => { router.push(a.link); setOpen(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{a.title}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{a.detail}</p>
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
