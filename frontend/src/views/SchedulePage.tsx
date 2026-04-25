import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getScheduleTasks } from '../services/api';
import { TaskStatusBadge } from '../components/tasks/TaskStatusSelect';
import type { TaskStatus } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScheduleTask {
  id: number;
  name: string;
  status: TaskStatus;
  due_date: string | null;
  timeline_start: string | null;
  timeline_end: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  time_spent_seconds: number;
  is_tracking: boolean;
  sort_order: number;
  project_id: number;
  project_code: string;
  project_name: string;
  project_start: string;
  project_end: string;
  project_category: string;
  project_status: string;
  health_status: string | null;
}

interface ProjectGroup {
  id: number;
  code: string;
  name: string;
  category: string;
  start: Date;
  end: Date;
  health: string | null;
  tasks: ScheduleTask[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

const STATUS_COLORS: Record<string, string> = {
  to_do: '#9ca3af',
  in_progress: '#3b82f6',
  working_on_it: '#22c55e',
  review: '#a855f7',
  done: '#10b981',
};

const HEALTH_COLORS: Record<string, string> = {
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
};

const CAT_BADGE: Record<string, string> = {
  instalasi: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  maintenance: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  perbaikan: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  upgrade: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  monitoring: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  security: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  networking: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  lainnya: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['schedule-tasks'],
    queryFn: getScheduleTasks,
    staleTime: 1000 * 60 * 2,
  });
  const router = useRouter();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  // Group tasks by project
  const { groups, assignees, timelineRange } = useMemo(() => {
    const allTasks = tasks as ScheduleTask[];

    // Collect unique assignees
    const assigneeMap = new Map<string, string>();
    for (const t of allTasks) {
      if (t.assigned_to_name) assigneeMap.set(String(t.assigned_to), t.assigned_to_name);
    }
    const assignees = Array.from(assigneeMap.entries()).map(([id, name]) => ({ id, name }));

    // Filter
    const filtered = allTasks.filter((t) => {
      if (categoryFilter !== 'all' && t.project_category !== categoryFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (assigneeFilter !== 'all' && String(t.assigned_to) !== assigneeFilter) return false;
      return true;
    });

    // Group by project
    const map = new Map<number, ProjectGroup>();
    for (const t of filtered) {
      if (!map.has(t.project_id)) {
        map.set(t.project_id, {
          id: t.project_id,
          code: t.project_code,
          name: t.project_name,
          category: t.project_category,
          start: new Date(t.project_start),
          end: new Date(t.project_end),
          health: t.health_status,
          tasks: [],
        });
      }
      map.get(t.project_id)!.tasks.push(t);
    }
    const groups = Array.from(map.values()).sort((a, b) => a.end.getTime() - b.end.getTime());

    // Global timeline range
    if (groups.length === 0) {
      return { groups: [], assignees, timelineRange: { min: new Date(), max: new Date(), days: 1 } };
    }
    const allDates: number[] = [];
    for (const g of groups) {
      allDates.push(g.start.getTime(), g.end.getTime());
      for (const t of g.tasks) {
        if (t.timeline_start) allDates.push(new Date(t.timeline_start).getTime());
        if (t.timeline_end) allDates.push(new Date(t.timeline_end).getTime());
        if (t.due_date) allDates.push(new Date(t.due_date).getTime());
      }
    }
    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
    const days = Math.max(1, daysBetween(min, max));

    return { groups, assignees, timelineRange: { min, max, days } };
  }, [tasks, categoryFilter, statusFilter, assigneeFilter]);

  const todayOffset = Math.max(0, Math.min(100,
    (daysBetween(timelineRange.min, new Date()) / timelineRange.days) * 100
  ));

  // Month markers
  const monthMarkers = useMemo(() => {
    const markers: { label: string; offset: number }[] = [];
    const cur = new Date(timelineRange.min);
    cur.setDate(1);
    if (cur < timelineRange.min) cur.setMonth(cur.getMonth() + 1);
    while (cur <= timelineRange.max) {
      const offset = (daysBetween(timelineRange.min, cur) / timelineRange.days) * 100;
      markers.push({
        label: cur.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        offset: Math.max(0, Math.min(100, offset)),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return markers;
  }, [timelineRange]);

  const toggleProject = (id: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedProjects(new Set(groups.map((g) => g.id)));
  const collapseAll = () => setExpandedProjects(new Set());

  // Task count summary
  const totalTasks = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  const scheduledTasks = groups.reduce((sum, g) => sum + g.tasks.filter((t) => t.timeline_start && t.timeline_end).length, 0);
  const unscheduledTasks = totalTasks - scheduledTasks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500 text-sm py-16">Failed to load schedule data.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Schedule</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Task-level scheduling across all active projects</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Category</option>
          <option value="instalasi">Instalasi</option>
          <option value="maintenance">Maintenance</option>
          <option value="perbaikan">Perbaikan</option>
          <option value="upgrade">Upgrade</option>
          <option value="monitoring">Monitoring</option>
          <option value="security">Security</option>
          <option value="networking">Networking</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Task Status</option>
          <option value="to_do">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="working_on_it">Working On It</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Technicians</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={expandAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Expand All</button>
          <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
          <button onClick={collapseAll} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">Collapse All</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span><strong className="text-gray-700 dark:text-gray-300">{groups.length}</strong> projects</span>
        <span><strong className="text-gray-700 dark:text-gray-300">{totalTasks}</strong> tasks</span>
        <span><strong className="text-emerald-600 dark:text-emerald-400">{scheduledTasks}</strong> scheduled</span>
        {unscheduledTasks > 0 && (
          <span><strong className="text-amber-600 dark:text-amber-400">{unscheduledTasks}</strong> unscheduled</span>
        )}
      </div>

      {/* Schedule content */}
      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-sm">No tasks match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {groups.map((group) => {
            const isExpanded = expandedProjects.has(group.id);
            const doneCount = group.tasks.filter((t) => t.status === 'done').length;
            const progress = group.tasks.length > 0 ? Math.round((doneCount / group.tasks.length) * 100) : 0;

            return (
              <div key={group.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                {/* Project header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 dark:bg-gray-900/50 cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
                  onClick={() => toggleProject(group.id)}
                >
                  {/* Expand arrow */}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>

                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{group.code}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{group.name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${CAT_BADGE[group.category] ?? CAT_BADGE.lainnya}`}>
                        {group.category}
                      </span>
                      {group.health && (
                        <span className={`text-[10px] font-bold uppercase ${HEALTH_COLORS[group.health] ?? 'text-gray-400'}`}>
                          {group.health}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                      <span>{formatDate(group.start.toISOString())} - {formatDate(group.end.toISOString())}</span>
                      <span>{doneCount}/{group.tasks.length} tasks done ({progress}%)</span>
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="w-20 hidden sm:block">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Navigate */}
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/projects/${group.id}`); }}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 shrink-0"
                    title="Open project"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>

                {/* Task rows - Gantt bars */}
                {isExpanded && (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {/* Timeline header */}
                    <div className="flex">
                      <div className="w-64 shrink-0" />
                      <div className="flex-1 relative h-6 border-l border-gray-200 dark:border-gray-700">
                        {monthMarkers.map((m, i) => (
                          <div
                            key={i}
                            className="absolute top-0 text-[9px] text-gray-400 dark:text-gray-500"
                            style={{ left: `${m.offset}%`, transform: 'translateX(-50%)' }}
                          >
                            {m.label}
                          </div>
                        ))}
                        {/* Today line */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                          style={{ left: `${todayOffset}%` }}
                        />
                      </div>
                    </div>

                    {group.tasks.map((task) => {
                      const hasSchedule = task.timeline_start && task.timeline_end;
                      const barStart = hasSchedule
                        ? (daysBetween(timelineRange.min, new Date(task.timeline_start!)) / timelineRange.days) * 100
                        : task.due_date
                        ? (daysBetween(timelineRange.min, new Date(task.due_date)) / timelineRange.days) * 100 - 1
                        : null;
                      const barWidth = hasSchedule
                        ? Math.max(1, (daysBetween(new Date(task.timeline_start!), new Date(task.timeline_end!)) / timelineRange.days) * 100)
                        : 2;
                      const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

                      return (
                        <div key={task.id} className="flex items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          {/* Task info column */}
                          <div className="w-64 shrink-0 px-4 py-2 pl-10 border-r border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-1.5">
                              {task.is_tracking && (
                                <span className="relative flex h-1.5 w-1.5 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                                </span>
                              )}
                              <span className="text-xs text-gray-800 dark:text-gray-200 truncate font-medium">{task.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <TaskStatusBadge status={task.status} size="sm" />
                              {task.assigned_to_name && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{task.assigned_to_name}</span>
                              )}
                            </div>
                          </div>

                          {/* Gantt bar column */}
                          <div className="flex-1 relative h-10 border-l border-gray-100 dark:border-gray-700">
                            {/* Today line */}
                            <div
                              className="absolute top-0 bottom-0 w-px bg-red-400/30 z-0"
                              style={{ left: `${todayOffset}%` }}
                            />

                            {barStart !== null ? (
                              <div
                                className="absolute top-2 h-6 rounded-md flex items-center px-1.5 text-[9px] text-white font-medium truncate shadow-sm"
                                style={{
                                  left: `${Math.max(0, barStart)}%`,
                                  width: `${Math.min(barWidth, 100 - Math.max(0, barStart))}%`,
                                  minWidth: '4px',
                                  backgroundColor: STATUS_COLORS[task.status] ?? '#9ca3af',
                                  opacity: task.status === 'done' ? 0.6 : 1,
                                }}
                                title={`${task.name}${hasSchedule ? `\n${formatDate(task.timeline_start!)} - ${formatDate(task.timeline_end!)}` : task.due_date ? `\nDue: ${formatDate(task.due_date)}` : ''}`}
                              >
                                {barWidth > 4 && (
                                  <span className="truncate">
                                    {hasSchedule ? `${formatDate(task.timeline_start!)} - ${formatDate(task.timeline_end!)}` : task.due_date ? `Due ${formatDate(task.due_date)}` : ''}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="absolute top-3 left-1 right-1 h-4 flex items-center">
                                <span className="text-[9px] text-gray-300 dark:text-gray-600 italic">No schedule set</span>
                              </div>
                            )}

                            {/* Overdue marker */}
                            {isOverdue && task.due_date && (
                              <div
                                className="absolute top-1 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-500"
                                style={{ left: `${(daysBetween(timelineRange.min, new Date(task.due_date)) / timelineRange.days) * 100}%`, transform: 'translateX(-50%)' }}
                                title={`Overdue: ${formatDate(task.due_date)}`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-600 dark:text-gray-300">Legend:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: color }} />
            {status.replace(/_/g, ' ')}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-px h-3 bg-red-400" />
          Today
        </span>
        <span className="flex items-center gap-1">
          <span className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-red-500" />
          Overdue
        </span>
      </div>
    </div>
  );
}
