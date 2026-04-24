import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '../hooks/useProjects';
import type { DashboardProject } from '../types';

const HEALTH_COLORS: Record<string, { bar: string; text: string; label: string }> = {
  red:   { bar: 'bg-red-500',    text: 'text-red-700 dark:text-red-400',    label: 'Critical' },
  amber: { bar: 'bg-amber-400',  text: 'text-amber-700 dark:text-amber-400', label: 'Warning' },
  green: { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', label: 'On Track' },
};

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'on-hold': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function formatShort(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProjectTimelinePage() {
  const { data: projects = [], isLoading, isError } = useProjects();
  const router = useRouter();
  const [filter, setFilter] = useState<string>('active');
  const [sortBy, setSortBy] = useState<'start' | 'end' | 'health'>('start');

  const filtered = useMemo(() => {
    let list = (projects as DashboardProject[]).filter((p) =>
      filter === 'all' ? true : p.status === filter
    );
    list = [...list].sort((a, b) => {
      if (sortBy === 'health') {
        const order: Record<string, number> = { red: 0, amber: 1, green: 2 };
        return (order[a.health_status ?? ''] ?? 3) - (order[b.health_status ?? ''] ?? 3);
      }
      if (sortBy === 'end') return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
    return list;
  }, [projects, filter, sortBy]);

  // Calculate timeline range (min start to max end across all filtered projects)
  const timelineRange = useMemo(() => {
    if (filtered.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    const starts = filtered.map((p) => new Date(p.start_date).getTime());
    const ends = filtered.map((p) => new Date(p.end_date).getTime());
    const minDate = new Date(Math.min(...starts));
    const maxDate = new Date(Math.max(...ends));
    const totalDays = Math.max(1, daysBetween(minDate.toISOString(), maxDate.toISOString()));
    return { minDate, maxDate, totalDays };
  }, [filtered]);

  // Today marker position
  const today = new Date();
  const todayOffset = Math.max(0, Math.min(100,
    (daysBetween(timelineRange.minDate.toISOString(), today.toISOString()) / timelineRange.totalDays) * 100
  ));

  // Generate month markers
  const monthMarkers = useMemo(() => {
    const markers: { label: string; offset: number }[] = [];
    const cur = new Date(timelineRange.minDate);
    cur.setDate(1);
    if (cur < timelineRange.minDate) cur.setMonth(cur.getMonth() + 1);
    while (cur <= timelineRange.maxDate) {
      const offset = (daysBetween(timelineRange.minDate.toISOString(), cur.toISOString()) / timelineRange.totalDays) * 100;
      markers.push({
        label: cur.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        offset: Math.max(0, Math.min(100, offset)),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return markers;
  }, [timelineRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500 text-sm py-16">Failed to load projects.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Timeline</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Visual overview of all project schedules and health status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {([['start', 'Start Date'], ['end', 'End Date'], ['health', 'Health']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSortBy(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === val
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> On Track</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Warning</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300 dark:bg-gray-600" /> No Data</span>
        </div>
      </div>

      {/* Timeline chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Month header */}
        <div className="relative h-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="absolute inset-0 ml-[220px] mr-4">
            {monthMarkers.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${m.offset}%` }}
              >
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap -translate-x-1/2">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project rows */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            No projects match the filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map((p) => {
              const startOffset = (daysBetween(timelineRange.minDate.toISOString(), p.start_date) / timelineRange.totalDays) * 100;
              const duration = (daysBetween(p.start_date, p.end_date) / timelineRange.totalDays) * 100;
              const health = HEALTH_COLORS[p.health_status ?? ''];
              const barColor = health?.bar ?? 'bg-gray-300 dark:bg-gray-600';
              const isOverdue = new Date(p.end_date) < today && p.status === 'active';
              const daysLeft = daysBetween(today.toISOString(), p.end_date);

              // Progress within the bar
              const progressPct = p.total_tasks > 0 ? (p.completed_tasks / p.total_tasks) * 100 : 0;

              return (
                <div
                  key={p.id}
                  className="flex items-center hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/projects/${p.id}`)}
                >
                  {/* Project name column */}
                  <div className="w-[220px] shrink-0 px-4 py-3 border-r border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{p.project_code}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[p.status] ?? ''}`}>
                        {p.status === 'on-hold' ? 'Hold' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatShort(p.start_date)} — {formatShort(p.end_date)}
                      {p.status === 'active' && (
                        <span className={isOverdue ? ' text-red-500 font-medium' : ''}>
                          {isOverdue ? ` (${Math.abs(daysLeft)}d overdue)` : ` (${daysLeft}d left)`}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Timeline bar area */}
                  <div className="flex-1 px-4 py-3 relative min-h-[52px]">
                    {/* Today line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-blue-400/50 dark:bg-blue-500/40 z-10"
                      style={{ left: `${todayOffset}%` }}
                    >
                      <div className="absolute -top-0.5 -translate-x-1/2 text-[8px] text-blue-500 font-medium">Today</div>
                    </div>

                    {/* Bar */}
                    <div
                      className={`relative h-7 rounded-md ${barColor} ${
                        p.status === 'cancelled' ? 'opacity-30' : p.status === 'on-hold' ? 'opacity-50' : ''
                      } transition-all group-hover:shadow-md`}
                      style={{
                        marginLeft: `${startOffset}%`,
                        width: `${Math.max(duration, 1.5)}%`,
                      }}
                    >
                      {/* Progress fill inside bar */}
                      {progressPct > 0 && p.status === 'active' && (
                        <div
                          className="absolute inset-y-0 left-0 bg-white/30 rounded-l-md"
                          style={{ width: `${progressPct}%` }}
                        />
                      )}

                      {/* Bar label */}
                      <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                        <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
                          {p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks} tasks` : ''}
                          {p.spi_value != null ? ` · SPI ${Number(p.spi_value).toFixed(2)}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Projects', value: filtered.length, color: 'text-blue-600' },
          { label: 'On Track', value: filtered.filter((p) => p.health_status === 'green').length, color: 'text-emerald-600' },
          { label: 'Warning', value: filtered.filter((p) => p.health_status === 'amber').length, color: 'text-amber-600' },
          { label: 'Critical', value: filtered.filter((p) => p.health_status === 'red').length, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
