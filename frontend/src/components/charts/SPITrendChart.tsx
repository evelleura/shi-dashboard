import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Dot,
} from 'recharts';
import { useSPITrendChart } from '../../hooks/useDashboard';
import type { DateRange } from '../../types';

interface Props {
  dateRange?: DateRange;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  // Guard against invalid dates
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

export default function SPITrendChart({ dateRange }: Props) {
  const { data: rawData, isLoading } = useSPITrendChart(dateRange);

  if (isLoading) {
    return (
      <CardWrapper title="SPI Trend (Weekly Average)">
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-label="Loading chart..." />
        </div>
      </CardWrapper>
    );
  }

  const chartData = (rawData ?? []).map((d) => ({
    week: formatWeekLabel(d.week_start),
    spi: Math.round(d.avg_spi * 1000) / 1000,
    projects: d.project_count,
  }));

  if (chartData.length === 0) {
    return (
      <CardWrapper title="SPI Trend (Weekly Average)">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No SPI trend data available</p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="SPI Trend (Weekly Average)">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 2]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => v.toFixed(2)}
            width={40}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            formatter={(value, name) => {
              if (name === 'SPI') return [Number(value).toFixed(3), name];
              return [value, name];
            }}
            labelFormatter={(label) => `Week of ${label}`}
          />
          {/* On Track threshold */}
          <ReferenceLine
            y={0.95}
            stroke="#22c55e"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{ value: 'On Track', position: 'right', fontSize: 10, fill: '#22c55e' }}
          />
          {/* Critical threshold */}
          <ReferenceLine
            y={0.85}
            stroke="#ef4444"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{ value: 'Critical', position: 'right', fontSize: 10, fill: '#ef4444' }}
          />
          <Line
            type="monotone"
            dataKey="spi"
            stroke="#3b82f6"
            strokeWidth={2}
            name="SPI"
            dot={<Dot r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
}
