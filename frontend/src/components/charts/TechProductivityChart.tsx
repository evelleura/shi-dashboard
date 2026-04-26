import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTechProductivityChart } from '../../hooks/useDashboard';
import type { DateRange } from '../../types';

interface Props {
  dateRange?: DateRange;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  if (isNaN(d.getTime())) return weekStart;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function CardWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function TechProductivityChart({ dateRange }: Props) {
  const { data: rawData, isLoading } = useTechProductivityChart(dateRange);

  if (isLoading) {
    return (
      <CardWrapper title="Tugas Selesai per Minggu">
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      </CardWrapper>
    );
  }

  const chartData = (rawData ?? []).map((d) => ({
    week: formatWeekLabel(d.week_start),
    completed: d.completed,
  }));

  if (chartData.length === 0) {
    return (
      <CardWrapper title="Tugas Selesai per Minggu">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Belum ada tugas selesai</p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="Tugas Selesai per Minggu">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            formatter={(value) => [`${String(value)} tugas`, 'Selesai']}
          />
          <Bar dataKey="completed" name="Selesai" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
}
