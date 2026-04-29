'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from '../../hooks/useLanguage';
import type { DashboardSummary } from '../../types';

interface Props {
  summary: DashboardSummary;
}

export default function ProjectHealthPieChart({ summary }: Props) {
  const { language } = useLanguage();
  const id = language === 'id';

  const labels = {
    onTrack:  id ? 'Tepat Waktu' : 'On Track',
    warning:  id ? 'Waspada'     : 'Warning',
    critical: id ? 'Kritis'      : 'Critical',
    noData:   id ? 'Tanpa Data'  : 'No Data',
    title:    id ? 'Distribusi Kesehatan Proyek' : 'Project Health Distribution',
    empty:    id ? 'Belum ada data proyek' : 'No project data available',
    projects: id ? 'Proyek' : 'Projects',
  };

  const COLORS: Record<string, string> = {
    [labels.onTrack]:  '#06d6a0',
    [labels.warning]:  '#ffd700',
    [labels.critical]: '#ef4444',
    [labels.noData]:   '#9ca3af',
  };

  const data = [
    { name: labels.onTrack,  value: summary.total_green },
    { name: labels.warning,  value: summary.total_amber },
    { name: labels.critical, value: summary.total_red },
    { name: labels.noData,   value: summary.total_no_health },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{labels.title}</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">{labels.empty}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{labels.title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? '#9ca3af'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [String(value), labels.projects]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
