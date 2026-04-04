import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTasksByStatusChart } from '../../hooks/useDashboard';

const STATUS_COLORS: Record<string, string> = {
  to_do: '#94a3b8',
  working_on_it: '#3b82f6',
  done: '#22c55e',
  overtime: '#f59e0b',
  over_deadline: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  to_do: 'To Do',
  working_on_it: 'Working On It',
  done: 'Done',
  overtime: 'Overtime',
  over_deadline: 'Over Deadline',
};

export default function TasksByStatusChart() {
  const { data: rawData, isLoading } = useTasksByStatusChart();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Status</h3>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const chartData = (rawData ?? []).map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? '#94a3b8',
  })).filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Status</h3>
        <p className="text-sm text-gray-400 text-center py-8">No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Status</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [String(value), 'Tasks']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
