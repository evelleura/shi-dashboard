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

  const cards = [
    { label: 'Active Projects', value: summary.active_projects, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Critical', value: summary.total_red, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Warning', value: summary.total_amber, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'On Track', value: summary.total_green, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Tasks', value: summary.total_tasks, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    {
      label: 'Overtime',
      value: summary.overtime_tasks,
      color: summary.overtime_tasks > 0 ? 'text-amber-600' : 'text-gray-600',
      bg: summary.overtime_tasks > 0 ? 'bg-amber-50' : 'bg-gray-50',
    },
    {
      label: 'Avg SPI',
      value: summary.avg_spi != null ? summary.avg_spi.toFixed(3) : '--',
      color: spiColor,
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-xl p-3 text-center`}>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
