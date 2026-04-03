import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import SummaryCards from '../components/dashboard/SummaryCards';
import ProjectHealthGrid from '../components/dashboard/ProjectHealthGrid';
import ProjectHealthPieChart from '../components/charts/ProjectHealthPieChart';
import TasksByStatusChart from '../components/charts/TasksByStatusChart';
import TasksByOwnerChart from '../components/charts/TasksByOwnerChart';
import TasksByDueDateChart from '../components/charts/TasksByDueDateChart';
import OverdueTasksChart from '../components/charts/OverdueTasksChart';
import BudgetStatusChart from '../components/charts/BudgetStatusChart';

type Filter = 'all' | 'red' | 'amber' | 'green' | 'none';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const [filter, setFilter] = useState<Filter>('all');

  const filterButtons: { label: string; value: Filter; color: string }[] = [
    { label: 'All', value: 'all', color: 'bg-gray-100 text-gray-700' },
    { label: 'Critical', value: 'red', color: 'bg-red-100 text-red-700' },
    { label: 'Warning', value: 'amber', color: 'bg-yellow-100 text-yellow-700' },
    { label: 'On Track', value: 'green', color: 'bg-green-100 text-green-700' },
    { label: 'No Data', value: 'none', color: 'bg-gray-100 text-gray-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading dashboard">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Failed to load dashboard data.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
        <p className="text-sm text-gray-500">PT Smart Home Inovasi Yogyakarta -- Real-time project health monitoring</p>
      </div>

      {/* KPI Summary Cards */}
      <SummaryCards summary={data.summary} />

      {/* Charts Row 1: Two pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectHealthPieChart summary={data.summary} />
        <TasksByStatusChart />
      </div>

      {/* Charts Row 2: Tasks by Owner + Tasks by Due Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TasksByOwnerChart />
        <TasksByDueDateChart />
      </div>

      {/* Charts Row 3: Overdue + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OverdueTasksChart />
        <BudgetStatusChart />
      </div>

      {/* Project Health Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Projects Overview</h2>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === btn.value
                    ? btn.color + ' ring-2 ring-offset-1 ring-current'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {btn.label}
                {btn.value === 'all' && ` (${data.summary.active_projects})`}
                {btn.value === 'red' && ` (${data.summary.total_red})`}
                {btn.value === 'amber' && ` (${data.summary.total_amber})`}
                {btn.value === 'green' && ` (${data.summary.total_green})`}
                {btn.value === 'none' && ` (${data.summary.total_no_health})`}
              </button>
            ))}
          </div>
        </div>
        <ProjectHealthGrid projects={data.projects} filter={filter} />
      </div>
    </div>
  );
}
