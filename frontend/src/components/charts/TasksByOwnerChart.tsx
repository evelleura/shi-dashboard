'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTasksByOwnerChart } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';

export default function TasksByOwnerChart({ dateRange }: { dateRange?: import('../../types').DateRange }) {
  const { data: rawData, isLoading } = useTasksByOwnerChart();
  const { language } = useLanguage();
  const id = language === 'id';
  const title = id ? 'Tugas per Teknisi' : 'Tasks by Owner';

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
          {id ? 'Belum ada tugas yang ditugaskan' : 'No tasks assigned yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="done"        stackId="a" fill="#10b981" name={id ? 'Selesai'          : 'Done'} />
          <Bar dataKey="review"      stackId="a" fill="#a855f7" name="Review" />
          <Bar dataKey="working"     stackId="a" fill="#22c55e" name={id ? 'Dikerjakan'       : 'Working'} />
          <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" name={id ? 'Dalam Proses'     : 'In Progress'} />
          <Bar dataKey="overtime"    stackId="a" fill="#f59e0b" name={id ? 'Terlambat'        : 'Overtime'} />
          <Bar dataKey="to_do"       stackId="a" fill="#94a3b8" name={id ? 'Belum Mulai'      : 'To Do'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
