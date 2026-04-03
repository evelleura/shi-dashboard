import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { DashboardSummary } from '../../types';

interface Props {
  summary: DashboardSummary;
}

const COLORS: Record<string, string> = {
  'On Track': '#06d6a0',
  'Warning': '#ffd700',
  'Critical': '#ef4444',
  'No Data': '#9ca3af',
};

export default function ProjectHealthPieChart({ summary }: Props) {
  const data = [
    { name: 'On Track', value: summary.total_green },
    { name: 'Warning', value: summary.total_amber },
    { name: 'Critical', value: summary.total_red },
    { name: 'No Data', value: summary.total_no_health },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Project Health Distribution</h3>
        <p className="text-sm text-gray-400 text-center py-8">No project data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Project Health Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [String(value), 'Projects']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
