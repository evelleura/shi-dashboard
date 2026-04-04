import { useNavigate } from 'react-router-dom';
import { useTechnicianDashboard } from '../hooks/useDashboard';
import type { HealthStatus } from '../types';

function HealthBadge({ status }: { status?: HealthStatus | null }) {
  if (!status) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">No data</span>;
  const config: Record<string, { bg: string; text: string; label: string }> = {
    green: { bg: 'bg-green-100', text: 'text-green-700', label: 'On Track' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Warning' },
    red: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
  };
  const c = config[status] ?? config.green;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.bg} ${c.text} font-medium`}>{c.label}</span>;
}

export default function TechnicianProjectsPage() {
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
        <p className="text-red-500 text-sm">Failed to load projects.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        <p className="text-sm text-gray-500">Projects assigned to you with client details</p>
      </div>

      {data.assigned_projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="mt-4 text-sm text-gray-500">No projects assigned to you yet.</p>
          <p className="text-xs text-gray-400 mt-1">Ask your manager to assign you to a project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.assigned_projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="text-left bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 p-5 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-base font-semibold text-gray-900">{proj.name}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    proj.phase === 'survey'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {proj.phase === 'survey' ? 'Survey' : 'Execution'}
                  </span>
                  <HealthBadge status={proj.health_status} />
                </div>
              </div>

              {/* Client info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{proj.client_name ?? 'No client assigned'}</p>
                    {proj.client_address && (
                      <p className="text-xs text-gray-400 mt-0.5">{proj.client_address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Task progress */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>My tasks: {proj.my_completed} of {proj.my_task_count} completed</span>
                <span className="font-medium">
                  {proj.my_task_count > 0 ? Math.round((proj.my_completed / proj.my_task_count) * 100) : 0}%
                </span>
              </div>
              {proj.my_task_count > 0 && (
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
  );
}
