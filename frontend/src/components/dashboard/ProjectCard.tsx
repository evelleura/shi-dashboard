import { Link } from 'react-router-dom';
import type { DashboardProject } from '../../types';
import StatusBadge from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';

interface Props {
  project: DashboardProject;
}

const borderColor: Record<string, string> = {
  red: 'border-l-red-500',
  amber: 'border-l-yellow-500',
  green: 'border-l-green-500',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProjectCard({ project }: Props) {
  const borderClass = project.health_status ? borderColor[project.health_status] : 'border-l-gray-300';

  return (
    <Link to={`/projects/${project.id}`}>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${borderClass} p-4 hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(project.start_date)} – {formatDate(project.end_date)}
            </p>
          </div>
          <StatusBadge status={project.health_status} />
        </div>

        <div className="mt-3">
          <ProgressBar
            actual={project.actual_progress ?? 0}
            planned={project.planned_progress ?? 0}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400">SPI</p>
            <p className="text-sm font-bold text-gray-700">
              {project.spi_value != null ? project.spi_value.toFixed(3) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Deviation</p>
            <p className={`text-sm font-bold ${(project.deviation_percent ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {project.deviation_percent != null
                ? `${project.deviation_percent >= 0 ? '+' : ''}${project.deviation_percent.toFixed(1)}%`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Duration</p>
            <p className="text-sm font-bold text-gray-700">{project.duration}d</p>
          </div>
        </div>

        {project.latest_constraints && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2">
            <span className="font-medium">Constraint: </span>
            {project.latest_constraints}
          </div>
        )}

        {project.last_report_date && (
          <p className="mt-2 text-xs text-gray-400 text-right">
            Last report: {formatDate(project.last_report_date)}
          </p>
        )}
      </div>
    </Link>
  );
}
