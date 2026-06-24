import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import TechQuickActionsBar from '../components/dashboard/TechQuickActionsBar';
import StatusBadge from '../components/ui/StatusBadge';
import DateRangePicker from '../components/ui/DateRangePicker';
import TechProductivityChart from '../components/charts/TechProductivityChart';
import TechTimeSpentChart from '../components/charts/TechTimeSpentChart';
import TechnicianSPIBreakdownChart from '../components/charts/TechnicianSPIBreakdownChart';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import type { HealthStatus, DateRange } from '../types';

const STATUS_COLORS = {
  to_do: '#94a3b8',
  in_progress: '#3b82f6',
  working_on_it: '#22c55e',
  review: '#a855f7',
  done: '#10b981',
  overtime: '#f59e0b',
  over_deadline: '#ef4444',
};

function HealthDot({ status }: { status?: HealthStatus | null }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  if (!status) return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />;
  return <span className={`w-2.5 h-2.5 rounded-full ${colorMap[status] ?? 'bg-gray-300'} inline-block`} />;
}

export default function TechnicianDashboard() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const router = useRouter();
  const { language } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleDateChange = useCallback((start: string, end: string) => {
    setDateRange(start && end ? { start, end } : undefined);
  }, []);

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

  const stats = data.my_tasks;
  const openEscalations = data.escalation_summary?.open ?? 0;

  const mySpi = data.my_spi;
  const spiVal = mySpi?.spi_value;
  const spiColor =
    mySpi?.status === 'red' ? 'text-red-600 dark:text-red-400'
    : mySpi?.status === 'amber' ? 'text-amber-600 dark:text-amber-400'
    : mySpi?.status === 'green' ? 'text-green-600 dark:text-green-400'
    : 'text-gray-400 dark:text-gray-500';

  const inProgressCount = (stats.in_progress ?? 0) + (stats.working_on_it ?? 0);
  const reviewCount = stats.review ?? 0;

  const statCards = [
    { label: t('tech.total_tasks', language), value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    { label: t('tech.to_do', language), value: stats.to_do, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
    { label: t('tech.in_progress', language), value: inProgressCount, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    {
      label: t('tech.review', language),
      value: reviewCount,
      color: reviewCount > 0 ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400',
      bg: reviewCount > 0 ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-800',
      border: reviewCount > 0 ? 'border-purple-200 dark:border-purple-800' : 'border-gray-200 dark:border-gray-700',
    },
    { label: t('tech.done', language), value: stats.done, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    {
      label: t('tech.overtime', language),
      value: stats.overtime,
      color: stats.overtime > 0 ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400',
      bg: stats.overtime > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-800',
      border: stats.overtime > 0 ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700',
    },
    {
      label: t('tech.over_deadline', language),
      value: stats.over_deadline,
      color: stats.over_deadline > 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400',
      bg: stats.over_deadline > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800',
      border: stats.over_deadline > 0 ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700',
    },
    {
      label: t('tech.open_escalations', language),
      value: openEscalations,
      color: openEscalations > 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400',
      bg: openEscalations > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800',
      border: openEscalations > 0 ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700',
    },
  ];

  const pieData = [
    { name: t('tech.to_do', language), value: stats.to_do, color: STATUS_COLORS.to_do },
    { name: t('tech.in_progress', language), value: stats.in_progress ?? 0, color: STATUS_COLORS.in_progress },
    { name: t('status.working_on_it', language), value: stats.working_on_it ?? 0, color: STATUS_COLORS.working_on_it },
    { name: t('tech.review', language), value: stats.review ?? 0, color: STATUS_COLORS.review },
    { name: t('tech.done', language), value: stats.done, color: STATUS_COLORS.done },
    { name: t('tech.overtime', language), value: stats.overtime, color: STATUS_COLORS.overtime },
    { name: t('tech.over_deadline', language), value: stats.over_deadline, color: STATUS_COLORS.over_deadline },
  ].filter((d) => d.value > 0);

  const barData = data.assigned_projects.map((p) => ({
    name: p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name,
    fullName: p.name,
    tasks: p.my_task_count,
    done: p.my_completed,
  }));

  // Diagnostik SPI: angka mentah + tugas yang MENYERET turun (recent_tasks yg dulu tak ditampilkan).
  const earned = mySpi?.earned ?? 0;
  const planned = mySpi?.planned ?? 0;
  // planned kini = jumlah tugas yang tenggatnya <= hari ini (bilangan bulat eksak).
  const plannedLabel = Number.isInteger(planned) ? String(planned) : planned.toFixed(1);
  const ratioPct = planned > 0 ? Math.min(100, (earned / planned) * 100) : 0;
  const todayMid = new Date(new Date().toDateString()).getTime();
  const isLate = (tk: { due_date?: string; status: string }) =>
    !!tk.due_date && tk.status !== 'done' && new Date(tk.due_date).getTime() < todayMid;
  const attentionTasks = [...data.recent_tasks]
    .filter((tk) => tk.status !== 'done')
    .sort((a, b) => (isLate(b) ? 1 : 0) - (isLate(a) ? 1 : 0))
    .slice(0, 8);
  const lateCount = data.recent_tasks.filter(isLate).length;
  const statusLabelMap: Record<string, string> = { to_do: 'Belum Mulai', working_on_it: 'Dikerjakan', done: 'Selesai' };
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-');

  const totalTasksLabel = 'Total Tugas';
  const completedLabel = 'Selesai';

  return (
    <div className="space-y-6">
      {/* Header + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('tech.my_dashboard', language)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('tech.task_overview', language)}</p>
        </div>
        <DateRangePicker
          startDate={dateRange?.start ?? ''}
          endDate={dateRange?.end ?? ''}
          onChange={handleDateChange}
        />
      </div>

      {/* Quick Actions */}
      <TechQuickActionsBar />

      {/* My SPI -- diagnostik: angka + KENAPA segini + apa yang menyeret turun */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('tech.my_spi', language)}</span>
            <span className={`text-3xl font-bold ${spiColor}`}>
              {spiVal != null ? Number(spiVal).toFixed(2) : '--'}
            </span>
          </div>
          <StatusBadge status={mySpi?.status ?? null} />
          {spiVal != null && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              = <span className="font-semibold text-gray-700 dark:text-gray-300">{earned}</span> tugas selesai dari{' '}
              <span
                className="font-semibold text-gray-700 dark:text-gray-300 underline decoration-dotted underline-offset-2 cursor-help"
                title="Jumlah tugasmu yang tenggatnya jatuh sampai hari ini -- yang seharusnya sudah selesai sekarang. SPI = selesai / jatuh-tempo."
              >
                {plannedLabel}
              </span>{' '}
              tugas jatuh tempo
            </span>
          )}
        </div>
        {spiVal != null ? (
          <>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${mySpi?.status === 'red' ? 'bg-red-500' : mySpi?.status === 'amber' ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${ratioPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lateCount > 0 ? (
                <>Penyebab utama: <span className="font-semibold text-red-600 dark:text-red-400">{lateCount} tugas melewati tenggat</span> menyeret SPI turun. Selesaikan tugas pada daftar di bawah untuk menaikkannya.</>
              ) : (
                <>Selesaikan tugas sesuai jadwal untuk menjaga SPI. Skala: &gt;= 0,95 Baik, 0,85-0,95 Waspada, &lt; 0,85 Kritis.</>
              )}
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('tech.spi_hint', language)}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section -- existing charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('tech.task_status_chart', language)}</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">{t('tech.no_tasks', language)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [String(value), 'Tugas']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('tech.tasks_per_project', language)}</h3>
          {barData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">{t('tech.no_projects', language)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value, name) => [String(value), name === 'tasks' ? totalTasksLabel : completedLabel]}
                />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="tasks" fill="#3b82f6" name={totalTasksLabel} radius={[0, 4, 4, 0]} />
                <Bar dataKey="done" fill="#22c55e" name={completedLabel} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* NEW: Productivity + Time Spent charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TechProductivityChart dateRange={dateRange} />
        <TechTimeSpentChart dateRange={dateRange} />
      </div>

      {/* Tugas yang MENYERET SPI -- recent_tasks (belum-selesai) yang DULU tak ditampilkan */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Tugas yang Perlu Perhatian</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Tugasmu yang belum selesai. Yang melewati tenggat (merah) langsung menyeret SPI turun.</p>
        {attentionTasks.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Tidak ada tugas tertunda. Kerja bagus!</p>
        ) : (
          <div className="space-y-2">
            {attentionTasks.map((tk) => {
              const late = isLate(tk);
              const daysLate = late && tk.due_date ? Math.floor((todayMid - new Date(tk.due_date).getTime()) / 86400000) : 0;
              return (
                <button
                  key={tk.id}
                  onClick={() => router.push(`/projects/${tk.project_id}`)}
                  className={`w-full text-left flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${late ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{tk.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                      {tk.project_name}{tk.due_date ? ` -- tenggat ${fmtDate(tk.due_date)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {late && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        Telat {daysLate}h
                      </span>
                    )}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {statusLabelMap[tk.status] ?? tk.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SPI PERSONAL teknisi dipecah per proyek (task-based: tugasnya sendiri, bukan SPI proyek) */}
      <TechnicianSPIBreakdownChart />

      {/* Assigned Projects Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('tech.assigned_projects', language)}</h2>
        {data.assigned_projects.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('tech.no_projects', language)}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.assigned_projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => router.push(`/projects/${proj.id}`)}
                className="text-left bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-4 transition-colors border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{proj.name}</h3>
                  <HealthDot status={proj.health_status} />
                </div>

                {proj.client_name && (
                  <div className="mb-2">
                    <p className="text-xs text-blue-600 font-medium">{proj.client_name}</p>
                    {proj.client_address && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{proj.client_address}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    proj.phase === 'survey'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {proj.phase === 'survey' ? t('project.phase_survey', language) : t('project.phase_execution', language)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Tugas: {proj.my_completed}/{proj.my_task_count}</span>
                  <span>{proj.my_task_count > 0 ? Math.round((proj.my_completed / proj.my_task_count) * 100) : 0}%</span>
                </div>
                {proj.my_task_count > 0 && (
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
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
      </div>
    </div>
  );
}
