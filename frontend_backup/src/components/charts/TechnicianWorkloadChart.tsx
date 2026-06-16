'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useTechnicianWorkloadChart } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';
import type { DateRange } from '../../types';

interface Props {
  dateRange?: DateRange;
}

function truncate(name: string, max = 15): string {
  return name.length > max ? `${name.slice(0, max)}...` : name;
}

function CardWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function TechnicianWorkloadChart({ dateRange }: Props) {
  const { data: rawData, isLoading } = useTechnicianWorkloadChart(dateRange);
  const { language } = useLanguage();
  const id = language === 'id';
  const title = id ? 'Beban Kerja Teknisi' : 'Technician Workload';

  if (isLoading) {
    return (
      <CardWrapper title={title}>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-label="Loading chart..." />
        </div>
      </CardWrapper>
    );
  }

  const chartData = (rawData ?? []).map((d) => ({
    name: truncate(d.name),
    done: d.done,
    in_progress: d.in_progress,
    overtime: d.overtime,
  }));

  if (chartData.length === 0) {
    return (
      <CardWrapper title={title}>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          {id ? 'Belum ada data beban kerja' : 'No workload data available'}
        </p>
      </CardWrapper>
    );
  }

  const chartHeight = Math.max(240, chartData.length * 48);

  return (
    <CardWrapper title={title}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} verticalAlign="bottom" />
          <Bar dataKey="done"        stackId="a" fill="#22c55e" name={id ? 'Selesai'      : 'Done'} />
          <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" name={id ? 'Dikerjakan'   : 'In Progress'} />
          <Bar dataKey="overtime"    stackId="a" fill="#ef4444" name={id ? 'Terlambat'    : 'Overtime'} />
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
}
