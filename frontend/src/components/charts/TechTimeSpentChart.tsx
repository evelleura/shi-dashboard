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
      <CardWrapper title="Time Spent by Project">
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-label="Loading chart..." />
        </div>
      </CardWrapper>
    );
  }

  const chartData = (rawData ?? []).map((d) => ({
    name: truncate(d.project_name),
    hours: Math.round(d.hours * 10) / 10,
  }));

  if (chartData.length === 0) {
    return (
      <CardWrapper title="Time Spent by Project">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No time tracking data yet</p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="Time Spent by Project">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            angle={-25}
            textAnchor="end"
            interval={0}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}h`}
            width={36}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            formatter={(value) => [`${value}h`, 'Hours']}
          />
          <Bar
            dataKey="hours"
            fill="#3b82f6"
            name="Hours"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
}
