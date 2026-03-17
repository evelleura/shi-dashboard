import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import SummaryCards from '../components/dashboard/SummaryCards';
import ProjectHealthGrid from '../components/dashboard/ProjectHealthGrid';
import CreateProjectForm from '../components/forms/CreateProjectForm';

type Filter = 'all' | 'red' | 'amber' | 'green' | 'none';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const [filter, setFilter] = useState<Filter>('all');
  const [showCreate, setShowCreate] = useState(false);

  const filterButtons: { label: string; value: Filter; color: string }[] = [
    { label: 'All', value: 'all', color: 'bg-gray-100 text-gray-700' },
    { label: 'Critical', value: 'red', color: 'bg-red-100 text-red-700' },
    { label: 'Warning', value: 'amber', color: 'bg-yellow-100 text-yellow-700' },
    { label: 'On Track', value: 'green', color: 'bg-green-100 text-green-700' },
    { label: 'No Report', value: 'none', color: 'bg-gray-100 text-gray-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
          <p className="text-sm text-gray-500">PT Smart Home Inovasi Yogyakarta</p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h2>
          <CreateProjectForm
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Summary cards */}
      <SummaryCards summary={data.summary} />

      {/* Filter + Grid */}
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === btn.value
                  ? btn.color + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {btn.label}
              {btn.value === 'all' && ` (${data.summary.total_active})`}
              {btn.value === 'red' && ` (${data.summary.total_red})`}
              {btn.value === 'amber' && ` (${data.summary.total_amber})`}
              {btn.value === 'green' && ` (${data.summary.total_green})`}
              {btn.value === 'none' && ` (${data.summary.total_no_report})`}
            </button>
          ))}
        </div>

        <ProjectHealthGrid projects={data.projects} filter={filter} />
      </div>

      {/* Recent reports */}
      {data.recent_reports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Reports (Last 7 Days)</h2>
          <div className="space-y-2">
            {data.recent_reports.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-800">{r.project_name}</span>
                  <span className="text-xs text-gray-400 ml-2">by {r.reporter_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-blue-600">{Number(r.progress_percentage).toFixed(1)}%</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(r.report_date).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
