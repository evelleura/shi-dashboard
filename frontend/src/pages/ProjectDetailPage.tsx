import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useDashboard';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id ?? '0');
  const { data: project, isLoading, isError } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Project not found.</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-blue-600 text-sm underline">Go Back</button>
      </div>
    );
  }

  // Build chart data: planned vs actual over time
  const startMs = new Date(project.start_date).getTime();
  const endMs = new Date(project.end_date).getTime();
  const duration = endMs - startMs;

  const reportsSorted = [...project.daily_reports].sort(
    (a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
  );

  const chartData = reportsSorted.map((r) => {
    const dayMs = new Date(r.report_date).getTime();
    const planned = duration > 0 ? Math.min(100, ((dayMs - startMs) / duration) * 100) : 100;
    return {
      date: new Date(r.report_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      actual: Number(r.progress_percentage),
      planned: Math.round(planned * 10) / 10,
    };
  });

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline mb-3 flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(project.start_date)} – {formatDate(project.end_date)} ({project.duration} days)
            </p>
          </div>
          <StatusBadge status={project.health_status ?? null} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'SPI', value: project.spi_value != null ? project.spi_value.toFixed(3) : '—', color: 'text-blue-600' },
          {
            label: 'Deviation',
            value: project.deviation_percent != null ? `${project.deviation_percent >= 0 ? '+' : ''}${project.deviation_percent.toFixed(1)}%` : '—',
            color: (project.deviation_percent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600',
          },
          { label: 'Actual', value: project.actual_progress != null ? `${project.actual_progress.toFixed(1)}%` : '—', color: 'text-gray-700' },
          { label: 'Planned', value: project.planned_progress != null ? `${project.planned_progress.toFixed(1)}%` : '—', color: 'text-gray-400' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400">{m.label}</p>
            <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <ProgressBar
          actual={project.actual_progress ?? 0}
          planned={project.planned_progress ?? 0}
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Progress Over Time</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="planned" stroke="#9ca3af" strokeDasharray="5 5" name="Planned" dot={false} />
              <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} name="Actual" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily reports timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Daily Reports ({project.daily_reports.length})
        </h2>
        {project.daily_reports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {project.daily_reports.map((r) => (
              <div key={r.id} className="flex gap-4 p-3 rounded-lg bg-gray-50">
                <div className="text-center min-w-16">
                  <p className="text-xs text-gray-400">
                    {new Date(r.report_date).toLocaleDateString('id-ID', { month: 'short', day: '2-digit' })}
                  </p>
                  <p className="text-lg font-bold text-blue-600">{Number(r.progress_percentage).toFixed(0)}%</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">{r.reporter_name}</p>
                  {r.constraints && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.constraints}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
