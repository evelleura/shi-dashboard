import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTasksByOwnerChart } from '../../hooks/useDashboard';

export default function TasksByOwnerChart() {
  const { data: rawData, isLoading } = useTasksByOwnerChart();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Owner</h3>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const chartData = rawData ?? [];

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Owner</h3>
        <p className="text-sm text-gray-400 text-center py-8">No tasks assigned yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Owner</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="done" stackId="a" fill="#10b981" name="Done" />
          <Bar dataKey="review" stackId="a" fill="#a855f7" name="Review" />
          <Bar dataKey="working" stackId="a" fill="#22c55e" name="Working" />
          <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" name="In Progress" />
          <Bar dataKey="overtime" stackId="a" fill="#f59e0b" name="Overtime" />
          <Bar dataKey="to_do" stackId="a" fill="#94a3b8" name="To Do" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
