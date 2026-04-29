'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '../../hooks/useLanguage';
import type { DashboardSummary } from '../../types';

type Filter = 'all' | 'red' | 'amber' | 'green' | 'none';

interface Props {
  summary: DashboardSummary;
  onFilter?: (filter: Filter) => void;
  activeFilter?: Filter;
}

export default function SummaryCards({ summary, onFilter, activeFilter }: Props) {
  const router = useRouter();
  const { language } = useLanguage();
  const id = language === 'id';

  const spiColor =
    summary.avg_spi != null && summary.avg_spi >= 0.95
      ? 'text-green-600'
      : summary.avg_spi != null && summary.avg_spi >= 0.85
      ? 'text-yellow-600'
      : 'text-red-600';

  const inProgressCount = (summary.in_progress_tasks ?? 0) + (summary.working_tasks ?? 0);
  const reviewCount = summary.review_tasks ?? 0;

  const cards: {
    label: string;
    value: string | number;
    color: string;
    bg: string;
    ringColor: string;
    action: () => void;
    filterKey?: Filter;
    tooltip: string;
  }[] = [
    {
      label: id ? 'Proyek Aktif' : 'Active Projects',
      value: summary.active_projects,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      ringColor: 'ring-blue-400',
      action: () => router.push('/projects'),
      tooltip: id ? 'Lihat semua proyek' : 'View all projects',
    },
    {
      label: id ? 'Kritis' : 'Critical',
      value: summary.total_red,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/30',
      ringColor: 'ring-red-400',
      filterKey: 'red',
      action: () => onFilter?.('red'),
      tooltip: id ? 'Filter proyek kritis' : 'Filter critical projects',
    },
    {
      label: id ? 'Waspada' : 'Warning',
      value: summary.total_amber,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      ringColor: 'ring-yellow-400',
      filterKey: 'amber',
      action: () => onFilter?.('amber'),
      tooltip: id ? 'Filter proyek waspada' : 'Filter warning projects',
    },
    {
      label: id ? 'Tepat Waktu' : 'On Track',
      value: summary.total_green,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/30',
      ringColor: 'ring-green-400',
      filterKey: 'green',
      action: () => onFilter?.('green'),
      tooltip: id ? 'Filter proyek on track' : 'Filter on-track projects',
    },
    {
      label: id ? 'Total Tugas' : 'Total Tasks',
      value: summary.total_tasks,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      ringColor: 'ring-indigo-400',
      action: () => router.push('/projects'),
      tooltip: id ? 'Lihat semua proyek & tugas' : 'View all projects & tasks',
    },
    {
      label: id ? 'Dikerjakan' : 'In Progress',
      value: inProgressCount,
      color: inProgressCount > 0 ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400',
      bg: inProgressCount > 0 ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700',
      ringColor: 'ring-blue-400',
      action: () => router.push('/projects'),
      tooltip: id ? 'Tugas sedang dikerjakan' : 'Tasks in progress',
    },
    {
      label: 'Review',
      value: reviewCount,
      color: reviewCount > 0 ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400',
      bg: reviewCount > 0 ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-gray-50 dark:bg-gray-700',
      ringColor: 'ring-purple-400',
      action: () => router.push('/projects'),
      tooltip: id ? 'Tugas menunggu review' : 'Tasks awaiting review',
    },
    {
      label: id ? 'Terlambat' : 'Overtime',
      value: summary.overtime_tasks,
      color: summary.overtime_tasks > 0 ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400',
      bg: summary.overtime_tasks > 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-gray-50 dark:bg-gray-700',
      ringColor: 'ring-amber-400',
      action: () => router.push('/schedule'),
      tooltip: id ? 'Lihat jadwal tugas overtime' : 'View overtime task schedule',
    },
    {
      label: id ? 'Rata-rata SPI' : 'Avg SPI',
      value: summary.avg_spi != null ? Number(summary.avg_spi).toFixed(3) : '--',
      color: spiColor,
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      ringColor: 'ring-purple-400',
      action: () => onFilter?.('all'),
      tooltip: 'Schedule Performance Index',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
      {cards.map((card) => {
        const isActive = card.filterKey !== undefined && activeFilter === card.filterKey;
        return (
          <button
            key={card.label}
            onClick={card.action}
            title={card.tooltip}
            className={`
              ${card.bg} rounded-xl p-3 text-center w-full
              transition-all duration-150
              hover:scale-105 hover:shadow-md hover:ring-2 hover:${card.ringColor}
              active:scale-95
              ${isActive ? `ring-2 ${card.ringColor} shadow-md scale-105` : ''}
              cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:${card.ringColor}
            `}
          >
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
            {isActive && (
              <div className={`mt-1 h-0.5 rounded-full mx-auto w-6 ${card.color.replace('text-', 'bg-')}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
