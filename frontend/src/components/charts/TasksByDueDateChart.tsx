import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTasksByDueDateChart } from '../../hooks/useDashboard';

export default function TasksByDueDateChart() {
  const { data: rawData, isLoading } = useTasksByDueDateChart();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Due Date</h3>
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
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Due Date</h3>
        <p className="text-sm text-gray-400 text-center py-8">No task timeline data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Due Date</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="done" stackId="a" fill="#06d6a0" name="Done" />
          <Bar dataKey="working_on_it" stackId="a" fill="#3b82f6" name="Working On It" />
          <Bar dataKey="stuck" stackId="a" fill="#ef4444" name="Stuck" />
          <Bar dataKey="to_do" stackId="a" fill="#9ca3af" name="To Do" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
