'use client';

import { useState, useMemo } from 'react';
import type { TaskStatus } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';

interface CalendarTask {
  id: number;
  name: string;
  status: TaskStatus;
  due_date: string | null;
  timeline_start: string | null;
  timeline_end: string | null;
  assigned_to_name: string | null;
  project_name: string;
  project_category: string;
}

interface Props {
  tasks: CalendarTask[];
}

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_DOT: Record<string, string> = {
  to_do: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  working_on_it: 'bg-green-500',
  review: 'bg-purple-500',
  done: 'bg-emerald-500',
};

// STATUS_LABEL is now computed inside the component using t()

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarView({ tasks }: Props) {
  const { language } = useLanguage();
  const months = language === 'id' ? MONTHS_ID : MONTHS_EN;
  const days = language === 'id' ? DAYS_ID : DAYS_EN;
  const STATUS_LABEL: Record<string, string> = {
    to_do: t('status.to_do', language),
    in_progress: t('status.in_progress', language),
    working_on_it: t('status.working_on_it', language),
    review: t('status.review', language),
    done: t('status.done', language),
  };

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [popoverDate, setPopoverDate] = useState<string | null>(null);

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  // Build a map: dateString -> tasks active on that day
  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      const dates: string[] = [];
      // Add due_date
      if (task.due_date) dates.push(task.due_date.substring(0, 10));
      // Add all days in timeline range
      if (task.timeline_start && task.timeline_end) {
        const start = new Date(task.timeline_start);
        const end = new Date(task.timeline_end);
        const cur = new Date(start);
        while (cur <= end) {
          dates.push(toLocalDateString(cur));
          cur.setDate(cur.getDate() + 1);
        }
      }
      for (const d of dates) {
        if (!map.has(d)) map.set(d, []);
        // Avoid duplicates
        if (!map.get(d)!.find((t) => t.id === task.id)) {
          map.get(d)!.push(task);
        }
      }
    }
    return map;
  }, [tasks]);

  // Build calendar grid
  const { weeks } = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const days: (Date | null)[] = [];

    // Pad start
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(currentYear, currentMonth, d));
    // Pad end to fill last row
    while (days.length % 7 !== 0) days.push(null);

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return { weeks };
  }, [currentYear, currentMonth]);

  const todayStr = toLocalDateString(today);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {months[currentMonth]} {currentYear}
        </h3>
        <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {days.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="min-h-[80px] bg-gray-50/50 dark:bg-gray-900/20" />;
              const dateStr = toLocalDateString(day);
              const dayTasks = tasksByDay.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = popoverDate === dateStr;
              return (
                <div
                  key={di}
                  className={`min-h-[80px] p-1.5 cursor-pointer transition-colors border-r border-gray-100 dark:border-gray-700/30 last:border-r-0 ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' :
                    isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' :
                    'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                  onClick={() => setPopoverDate(isSelected ? null : dateStr)}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {day.getDate()}
                  </div>
                  {/* Task dots — show up to 3 */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className={`w-full h-1.5 rounded-full ${STATUS_DOT[t.status] ?? 'bg-gray-400'}`} />
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[9px] text-gray-400 pl-0.5">+{dayTasks.length - 3}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Popover: task list for selected day */}
      {popoverDate && (() => {
        const dayTasks = tasksByDay.get(popoverDate) ?? [];
        const [y, m, d] = popoverDate.split('-').map(Number);
        const label = `${d} ${months[m - 1]} ${y}`;
        return (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h4>
              <span className="text-xs text-gray-500">{dayTasks.length} {t('schedule.tasks_count', language)}</span>
            </div>
            {dayTasks.length === 0 ? (
              <p className="text-xs text-gray-400">{t('schedule.no_tasks_day', language)}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dayTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[t.status] ?? 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{t.project_name}</p>
                      {t.assigned_to_name && (
                        <p className="text-[10px] text-gray-400">{t.assigned_to_name}</p>
                      )}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 shrink-0">
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
