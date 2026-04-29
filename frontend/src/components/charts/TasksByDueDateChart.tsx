'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTasksByDueDateChart } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';

export default function TasksByDueDateChart({ dateRange }: { dateRange?: import('../../types').DateRange }) {
  const { data: rawData, isLoading } = useTasksByDueDateChart(dateRange);
  const { language } = useLanguage();
  const id = language === 'id';
  const title = id ? 'Tugas per Tenggat Waktu' : 'Tasks by Due Date';

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          {id ? 'Belum ada data tenggat waktu tugas' : 'No task timeline data available'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="done"         stackId="a" fill="#10b981" name={id ? 'Selesai'          : 'Done'} />
          <Bar dataKey="review"       stackId="a" fill="#a855f7" name="Review" />
          <Bar dataKey="working_on_it" stackId="a" fill="#22c55e" name={id ? 'Sedang Dikerjakan' : 'Working On It'} />
          <Bar dataKey="in_progress"  stackId="a" fill="#3b82f6" name={id ? 'Dalam Proses'     : 'In Progress'} />
          <Bar dataKey="overtime"     stackId="a" fill="#f59e0b" name={id ? 'Terlambat'        : 'Overtime'} />
          <Bar dataKey="over_deadline" stackId="a" fill="#ef4444" name={id ? 'Lewat Deadline'  : 'Over Deadline'} />
          <Bar dataKey="to_do"        stackId="a" fill="#94a3b8" name={id ? 'Belum Mulai'      : 'To Do'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
