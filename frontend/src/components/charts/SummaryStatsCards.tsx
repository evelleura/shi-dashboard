import type { DashboardSummary } from '../../types';

interface Props {
  summary: DashboardSummary;
}

export default function SummaryStatsCards({ summary }: Props) {
  const spiColor =
    summary.avg_spi != null && summary.avg_spi >= 0.95
      ? 'text-green-600'
      : summary.avg_spi != null && summary.avg_spi >= 0.85
      ? 'text-yellow-600'
      : 'text-red-600';

  const completionRate =
    summary.total_tasks > 0
      ? ((summary.completed_tasks / summary.total_tasks) * 100).toFixed(1)
      : '0.0';

  const onTrackPercent =
    summary.active_projects > 0
      ? ((summary.total_green / summary.active_projects) * 100).toFixed(0)
      : '0';

  const inProgressCount = (summary.in_progress_tasks ?? 0) + (summary.working_tasks ?? 0);
  const reviewCount = summary.review_tasks ?? 0;

  const cards = [
    {
      label: 'Total Projects',
      value: summary.total_projects,
      sub: `${summary.active_projects} active`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'On Track',
      value: `${onTrackPercent}%`,
      sub: `${summary.total_green} projects`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'Warning',
      value: summary.total_amber,
      sub: 'need attention',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
    {
      label: 'Critical',
      value: summary.total_red,
      sub: 'behind schedule',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      label: 'Avg SPI',
      value: summary.avg_spi != null ? Number(summary.avg_spi).toFixed(3) : '--',
      sub: 'schedule performance',
      color: spiColor,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
    {
      label: 'Tasks Done',
      value: `${completionRate}%`,
      sub: `${summary.completed_tasks}/${summary.total_tasks}`,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      sub: 'active tasks',
      color: inProgressCount > 0 ? 'text-blue-600' : 'text-gray-600',
      bg: inProgressCount > 0 ? 'bg-blue-50' : 'bg-gray-50',
      border: inProgressCount > 0 ? 'border-blue-200' : 'border-gray-200',
    },
    {
      label: 'Review',
      value: reviewCount,
      sub: 'pending approval',
      color: reviewCount > 0 ? 'text-purple-600' : 'text-gray-600',
      bg: reviewCount > 0 ? 'bg-purple-50' : 'bg-gray-50',
      border: reviewCount > 0 ? 'border-purple-200' : 'border-gray-200',
    },
    {
      label: 'Overtime',
      value: summary.overtime_tasks,
      sub: 'working past due',
      color: summary.overtime_tasks > 0 ? 'text-amber-600' : 'text-gray-600',
      bg: summary.overtime_tasks > 0 ? 'bg-amber-50' : 'bg-gray-50',
      border: summary.overtime_tasks > 0 ? 'border-amber-200' : 'border-gray-200',
    },
    {
      label: 'Overdue',
      value: summary.overdue_projects,
      sub: 'projects past deadline',
      color: summary.overdue_projects > 0 ? 'text-orange-600' : 'text-gray-600',
      bg: summary.overdue_projects > 0 ? 'bg-orange-50' : 'bg-gray-50',
      border: summary.overdue_projects > 0 ? 'border-orange-200' : 'border-gray-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} border ${card.border} rounded-xl p-3 text-center`}
        >
          <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs font-medium text-gray-700 mt-0.5">{card.label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
