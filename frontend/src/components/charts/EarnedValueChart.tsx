'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useEarnedValueChart } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';

interface Props {
  projectId: number;
}

export default function EarnedValueChart({ projectId }: Props) {
  const { data, isLoading } = useEarnedValueChart(projectId);
  const { language } = useLanguage();
  const id = language === 'id';
  const title = id ? 'Analisis Earned Value' : 'Earned Value Analysis';

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

  const timeline = data?.timeline ?? [];

  if (timeline.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          {id
            ? 'Belum ada data earned value. Perbarui status tugas untuk membuat timeline.'
            : 'No earned value data yet. Submit task updates to generate the timeline.'}
        </p>
      </div>
    );
  }

  const chartData = timeline.map((point) => ({
    date: new Date(point.date).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: '2-digit', month: 'short' }),
    pv: Math.round(point.pv * 10) / 10,
    ev: Math.round(point.ev * 10) / 10,
    spi: Math.round(point.spi * 1000) / 1000,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="progress" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
          <YAxis yAxisId="spi" orientation="right" domain={[0, 2]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => v.toFixed(1)} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            formatter={(value, name) => {
              const v = Number(value);
              if (name === 'SPI') return [v.toFixed(3), name];
              return [`${v.toFixed(1)}%`, name];
            }}
          />
          <Legend iconType="line" wrapperStyle={{ fontSize: '12px' }} />
          <Line
            yAxisId="progress" type="monotone" dataKey="pv"
            stroke="#9ca3af" strokeDasharray="5 5"
            name={id ? 'Nilai Rencana (PV)' : 'Planned Value (PV)'}
            dot={false}
          />
          <Line
            yAxisId="progress" type="monotone" dataKey="ev"
            stroke="#3b82f6" strokeWidth={2}
            name={id ? 'Nilai Terima (EV)' : 'Earned Value (EV)'}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="spi" type="monotone" dataKey="spi"
            stroke="#06d6a0" strokeWidth={2}
            name="SPI"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
