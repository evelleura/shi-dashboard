import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useProjectCategoriesChart } from '../../hooks/useDashboard';
import type { DateRange } from '../../types';

interface Props {
  dateRange?: DateRange;
}

const PHASE_CONFIG: Record<string, { label: string; color: string }> = {
  survey: { label: 'Survey', color: '#a855f7' },
  execution: { label: 'Execution', color: '#3b82f6' },
};

function CardWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function ProjectCategoryPieChart({ dateRange }: Props) {
  const { data: rawData, isLoading } = useProjectCategoriesChart(dateRange);

  if (isLoading) {
    return (
      <CardWrapper title="Projects by Phase">
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-label="Loading chart..." />
        </div>
      </CardWrapper>
    );
  }

  const chartData = (rawData ?? []).map((d) => ({
    name: PHASE_CONFIG[d.phase]?.label ?? d.phase,
    value: d.count,
    color: PHASE_CONFIG[d.phase]?.color ?? '#9ca3af',
  })).filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <CardWrapper title="Projects by Phase">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No project data available</p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="Projects by Phase">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={false}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
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
    </CardWrapper>
  );
}
