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
    return <EmptyState title="Tidak ada proyek ditemukan" description="Coba ubah filter atau buat proyek baru." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.sort((a,b)=>(b.spi_value??0)-(a.spi_value??0)).map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
