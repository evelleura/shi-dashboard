import type { DashboardProject } from '../../types';
import ProjectCard from './ProjectCard';
import EmptyState from '../ui/EmptyState';

interface Props {
  projects: DashboardProject[];
  filter?: string;
}

export default function ProjectHealthGrid({ projects, filter }: Props) {
  const filtered = filter && filter !== 'all'
    ? projects.filter((p) => p.health_status === filter || (filter === 'none' && !p.health_status))
    : projects;

  if (filtered.length === 0) {
    return <EmptyState title="No projects found" description="Try changing the filter or create a new project." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
