import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';
import { useTechProductivityChart } from '../../hooks/useDashboard';
import type { DateRange } from '../../types';

interface Props {
  dateRange?: DateRange;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  if (isNaN(d.getTime())) return weekStart;
  return `${d.getDate()}/${d.getMonth() + 1}`;
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
      <CardWrapper title="My Productivity (Tasks/Week)">
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" aria-label="Loading chart..." />
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
      <CardWrapper title="My Productivity (Tasks/Week)">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No productivity data yet</p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="My Productivity (Tasks/Week)">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            formatter={(value) => [String(value), 'Tasks Completed']}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#productivityGradient)"
            name="Completed"
            dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
}

