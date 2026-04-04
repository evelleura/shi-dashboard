import { useNavigate } from 'react-router-dom';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { HealthStatus } from '../types';

const STATUS_COLORS = {
  to_do: '#94a3b8',
  working_on_it: '#3b82f6',
  done: '#22c55e',
  overtime: '#f59e0b',
  over_deadline: '#ef4444',
};

function HealthDot({ status }: { status?: HealthStatus | null }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  if (!status) return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />;
  return <span className={`w-2.5 h-2.5 rounded-full ${colorMap[status] ?? 'bg-gray-300'} inline-block`} />;
}

export default function TechnicianDashboard() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Failed to load dashboard.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Retry</button>
      </div>
    );
  }

  const stats = data.my_tasks;
  const statCards = [
    { label: 'Total Tasks', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'To Do', value: stats.to_do, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
    { label: 'In Progress', value: stats.working_on_it, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Done', value: stats.done, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    {
      label: 'Overtime',
      value: stats.overtime,
      color: stats.overtime > 0 ? 'text-amber-600' : 'text-gray-600',
      bg: stats.overtime > 0 ? 'bg-amber-50' : 'bg-gray-50',
      border: stats.overtime > 0 ? 'border-amber-200' : 'border-gray-200',
    },
    {
      label: 'Over Deadline',
      value: stats.over_deadline,
      color: stats.over_deadline > 0 ? 'text-red-600' : 'text-gray-600',
      bg: stats.over_deadline > 0 ? 'bg-red-50' : 'bg-gray-50',
      border: stats.over_deadline > 0 ? 'border-red-200' : 'border-gray-200',
    },
  ];

  // Pie chart data -- task status distribution
  const pieData = [
    { name: 'To Do', value: stats.to_do, color: STATUS_COLORS.to_do },
    { name: 'Working On It', value: stats.working_on_it, color: STATUS_COLORS.working_on_it },
    { name: 'Done', value: stats.done, color: STATUS_COLORS.done },
    { name: 'Overtime', value: stats.overtime, color: STATUS_COLORS.overtime },
    { name: 'Over Deadline', value: stats.over_deadline, color: STATUS_COLORS.over_deadline },
  ].filter((d) => d.value > 0);

  // Bar chart data -- tasks per project
  const barData = data.assigned_projects.map((p) => ({
    name: p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name,
    fullName: p.name,
    tasks: p.my_task_count,
    done: p.my_completed,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-sm text-gray-500">Your task overview and assigned projects</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie/Donut Chart -- Task Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, idx) => (
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
          )}
        </div>

        {/* Bar Chart -- Tasks per Project */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks per Project</h3>
          {barData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No projects assigned yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value: number, name: string) => [value, name === 'tasks' ? 'Total Tasks' : 'Completed']}
                />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="tasks" fill="#3b82f6" name="Total Tasks" radius={[0, 4, 4, 0]} />
                <Bar dataKey="done" fill="#22c55e" name="Completed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Assigned Projects Cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Assigned Projects</h2>
        {data.assigned_projects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No projects assigned to you yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.assigned_projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors border border-gray-200 hover:border-gray-300"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{proj.name}</h3>
                  <HealthDot status={proj.health_status} />
                </div>

                {/* Client info */}
                {proj.client_name && (
                  <div className="mb-2">
                    <p className="text-xs text-blue-600 font-medium">{proj.client_name}</p>
                    {proj.client_address && (
                      <p className="text-xs text-gray-400 line-clamp-1">{proj.client_address}</p>
                    )}
                  </div>
                )}

                {/* Phase badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    proj.phase === 'survey'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {proj.phase === 'survey' ? 'Survey' : 'Execution'}
                  </span>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Tasks: {proj.my_completed}/{proj.my_task_count}</span>
                  <span>{proj.my_task_count > 0 ? Math.round((proj.my_completed / proj.my_task_count) * 100) : 0}%</span>
                </div>
                {proj.my_task_count > 0 && (
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(proj.my_completed / proj.my_task_count) * 100}%` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
