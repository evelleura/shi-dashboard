import Link from 'next/link';
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
  const taskProgress = project.total_tasks > 0
    ? Math.round((project.completed_tasks / project.total_tasks) * 100)
    : 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${borderClass} p-4 hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{project.name}</h3>
            {project.client_name && (
              <p className="text-xs text-blue-500 mt-0.5">{project.client_name}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-0.5">
              {formatDate(project.start_date)} -- {formatDate(project.end_date)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            <StatusBadge status={project.health_status} />
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              project.phase === 'survey' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {project.phase === 'survey' ? 'Survey' : 'Execution'}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <ProgressBar
            actual={project.actual_progress ?? 0}
            planned={project.planned_progress ?? 0}
          />
        </div>

        {/* Metrics row */}
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-[10px] text-gray-400">SPI</p>
            <p className="text-xs font-bold text-gray-700">
              {project.spi_value != null ? Number(project.spi_value).toFixed(2) : '--'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Dev</p>
            <p className={`text-xs font-bold ${(project.deviation_percent ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {project.deviation_percent != null
                ? `${project.deviation_percent >= 0 ? '+' : ''}${Number(project.deviation_percent).toFixed(1)}%`
                : '--'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Tasks</p>
            <p className="text-xs font-bold text-gray-700">
              {project.completed_tasks}/{project.total_tasks}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Done</p>
            <p className="text-xs font-bold text-gray-700">{taskProgress}%</p>
          </div>
        </div>

        {/* Value */}
        {Number(project.project_value) > 0 && (
          <p className="mt-2 text-[10px] text-gray-400 text-right">
            Rp {Number(project.project_value).toLocaleString('id-ID')}
          </p>
        )}
      </div>
    </Link>
  );
}
