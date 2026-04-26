import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTechTimeSpentChart } from '../../hooks/useDashboard';
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

export default function TechTimeSpentChart({ dateRange }: Props) {
  const { data: rawData, isLoading } = useTechTimeSpentChart(dateRange);

  if (isLoading) {
    return (
      <CardWrapper title="Waktu per Proyek (jam)">
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      </CardWrapper>
    );
  }

  const chartData = (rawData ?? []).map((d) => ({
    name: truncate(d.project_name),
    fullName: d.project_name,
    hours: Math.round(d.hours * 10) / 10,
  }));

  if (chartData.length === 0) {
    return (
      <CardWrapper title="Waktu per Proyek (jam)">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Belum ada data waktu pengerjaan</p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="Waktu per Proyek (jam)">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}j`}
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10 }}
            width={100}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            formatter={(value, _name, props) => [
              `${String(value)} jam`,
              (props.payload as { fullName?: string })?.fullName ?? String(_name),
            ]}
          />
          <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
}
