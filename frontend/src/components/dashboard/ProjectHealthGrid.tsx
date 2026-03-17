import type { DashboardProject } from '../../types';
import ProjectCard from './ProjectCard';

interface Props {
  projects: DashboardProject[];
  filter?: string;
}

export default function ProjectHealthGrid({ projects, filter }: Props) {
  const filtered = filter && filter !== 'all'
    ? projects.filter((p) => p.health_status === filter || (filter === 'none' && !p.health_status))
    : projects;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">📊</p>
        <p className="text-sm">No projects found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
