import type { DashboardSummary } from '../../types';

interface Props {
  summary: DashboardSummary;
}

export default function SummaryCards({ summary }: Props) {
  const spiColor =
    summary.avg_spi != null && summary.avg_spi >= 0.95
      ? 'text-green-600'
      : summary.avg_spi != null && summary.avg_spi >= 0.85
      ? 'text-yellow-600'
      : 'text-red-600';

  const inProgressCount = (summary.in_progress_tasks ?? 0) + (summary.working_tasks ?? 0);
  const reviewCount = summary.review_tasks ?? 0;

  const cards = [
    { label: 'Active Projects', value: summary.active_projects, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Critical', value: summary.total_red, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
    { label: 'Warning', value: summary.total_amber, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
    { label: 'On Track', value: summary.total_green, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Total Tasks', value: summary.total_tasks, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    {
      label: 'In Progress',
      value: inProgressCount,
      color: inProgressCount > 0 ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400',
      bg: inProgressCount > 0 ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700',
    },
    {
      label: 'Review',
      value: reviewCount,
      color: reviewCount > 0 ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400',
      bg: reviewCount > 0 ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-gray-50 dark:bg-gray-700',
    },
    {
      label: 'Overtime',
      value: summary.overtime_tasks,
      color: summary.overtime_tasks > 0 ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400',
      bg: summary.overtime_tasks > 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-gray-50 dark:bg-gray-700',
    },
    {
      label: 'Avg SPI',
      value: summary.avg_spi != null ? Number(summary.avg_spi).toFixed(3) : '--',
      color: spiColor,
      bg: 'bg-purple-50 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-xl p-3 text-center`}>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
