import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useEarnedValueChart } from '../../hooks/useDashboard';

interface Props {
  projectId: number;
}

export default function EarnedValueChart({ projectId }: Props) {
  const { data, isLoading } = useEarnedValueChart(projectId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Earned Value Analysis</h3>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const timeline = data?.timeline ?? [];

  if (timeline.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Earned Value Analysis</h3>
        <p className="text-sm text-gray-400 text-center py-8">No earned value data yet. Submit task updates to generate the timeline.</p>
      </div>
    );
  }

  const chartData = timeline.map((point) => ({
    date: new Date(point.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    pv: Math.round(point.pv * 10) / 10,
    ev: Math.round(point.ev * 10) / 10,
    spi: Math.round(point.spi * 1000) / 1000,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Earned Value Analysis</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="progress"
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            yAxisId="spi"
            orientation="right"
            domain={[0, 2]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
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
            yAxisId="progress"
            type="monotone"
            dataKey="pv"
            stroke="#9ca3af"
            strokeDasharray="5 5"
            name="Planned Value (PV)"
            dot={false}
          />
          <Line
            yAxisId="progress"
            type="monotone"
            dataKey="ev"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Earned Value (EV)"
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="spi"
            type="monotone"
            dataKey="spi"
            stroke="#06d6a0"
            strokeWidth={2}
            name="SPI"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
