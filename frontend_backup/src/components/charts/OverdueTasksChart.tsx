'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOverdueTasksChart } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';

export default function OverdueTasksChart({ dateRange }: { dateRange?: import('../../types').DateRange }) {
  const { data: rawData, isLoading } = useOverdueTasksChart(dateRange);
  const { language } = useLanguage();
  const id = language === 'id';

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {id ? 'Tugas Terlambat' : 'Overdue Tasks'}
        </h3>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const chartData = rawData ?? [];

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {id ? 'Tugas Terlambat' : 'Overdue Tasks'}
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          {id ? 'Tidak ada tugas terlambat — semua tepat jadwal' : 'No overdue tasks -- everything on schedule'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {id ? 'Tugas Terlambat per Proyek' : 'Overdue Tasks by Project'}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="project_name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="overtime"     fill="#f59e0b" name={id ? 'Terlambat'      : 'Overtime'} />
          <Bar dataKey="over_deadline" fill="#ef4444" name={id ? 'Lewat Deadline' : 'Over Deadline'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
