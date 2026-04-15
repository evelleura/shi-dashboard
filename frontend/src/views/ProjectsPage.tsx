import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import ProjectForm from '../components/projects/ProjectForm';
import DataTable, { type Column, type RowAge } from '../components/ui/DataTable';
import type { DashboardProject, CreateProjectData } from '../types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getProjectAge(p: DashboardProject): RowAge {
  const created = p.created_at ? new Date(p.created_at).getTime() : 0;
  const updated = p.updated_at ? new Date(p.updated_at).getTime() : created;
  const latest = Math.max(created, updated);
  const now = Date.now();
  const hoursAgo = (now - latest) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 'new';
  if (hoursAgo < 24 * 7) return 'recent';
  // Stale: no tasks completed and older than 14 days
  if (hoursAgo > 24 * 14 && p.completed_tasks === 0 && p.total_tasks > 0) return 'stale';
  return 'normal';
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading, isError } = useProjects();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateProject();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() =>
    (projects as DashboardProject[]).filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.client_name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
  [projects, search, statusFilter]);

  const columns: Column<DashboardProject>[] = useMemo(() => [
    {
      key: 'project_code',
      label: 'ID',
      render: (p) => <span className="text-xs font-mono font-semibold text-gray-500">{p.project_code}</span>,
      sortValue: (p) => p.project_code,
      exportValue: (p) => p.project_code,
      headerClass: 'w-24',
    },
    {
      key: 'name',
      label: 'Project',
      render: (p) => (
        <div>
          <Link href={`/projects/${p.id}`} className="font-medium text-sm text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
            {p.name}
          </Link>
          {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
        </div>
      ),
      sortValue: (p) => p.name.toLowerCase(),
      exportValue: (p) => p.name,
    },
    {
      key: 'client_name',
      label: 'Client',
      render: (p) => <span className="text-sm text-gray-600">{p.client_name ?? '--'}</span>,
      sortValue: (p) => (p.client_name ?? '').toLowerCase(),
      exportValue: (p) => p.client_name ?? '',
    },
    {
      key: 'phase',
      label: 'Phase',
      render: (p) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          p.phase === 'survey' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {p.phase === 'survey' ? 'Survey' : 'Execution'}
        </span>
      ),
      sortValue: (p) => p.phase,
      exportValue: (p) => p.phase === 'survey' ? 'Survey' : 'Execution',
    },
    {
      key: 'health_status',
      label: 'Health',
      render: (p) => <StatusBadge status={p.health_status ?? null} />,
      sortValue: (p) => {
        const order: Record<string, number> = { red: 0, amber: 1, green: 2 };
        return order[p.health_status ?? ''] ?? 3;
      },
      exportValue: (p) => p.health_status ?? 'N/A',
    },
    {
      key: 'spi_value',
      label: 'SPI',
      align: 'right' as const,
      render: (p) => <span className="text-sm text-gray-700">{p.spi_value != null ? Number(p.spi_value).toFixed(3) : '--'}</span>,
      sortValue: (p) => p.spi_value ?? -1,
      exportValue: (p) => p.spi_value != null ? Number(p.spi_value).toFixed(3) : '',
    },
    {
      key: 'tasks',
      label: 'Tasks',
      render: (p) => <span className="text-sm text-gray-600">{p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '--'}</span>,
      sortValue: (p) => p.total_tasks > 0 ? p.completed_tasks / p.total_tasks : -1,
      exportValue: (p) => p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '',
    },
    {
      key: 'timeline',
      label: 'Timeline',
      render: (p) => <span className="text-xs text-gray-500">{formatDate(p.start_date)} -- {formatDate(p.end_date)}</span>,
      sortValue: (p) => p.start_date,
      exportValue: (p) => `${formatDate(p.start_date)} - ${formatDate(p.end_date)}`,
    },
    {
      key: 'project_value',
      label: 'Value',
      align: 'right' as const,
      render: (p) => (
        <span className="text-sm text-gray-600">
          {Number(p.project_value) > 0 ? `Rp ${Number(p.project_value).toLocaleString('id-ID')}` : '--'}
        </span>
      ),
      sortValue: (p) => Number(p.project_value) || 0,
      exportValue: (p) => Number(p.project_value) || 0,
    },
  ], []);

  const handleCreate = async (data: CreateProjectData) => {
    await createMutation.mutateAsync(data);
    setShowCreate(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500 text-sm py-16">Failed to load projects.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search projects or clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search projects"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable<DashboardProject>
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        rowAge={getProjectAge}
        onRowClick={(p) => router.push(`/projects/${p.id}`)}
        defaultSortKey="project_code"
        defaultSortDesc={true}
        exportFileName="projects"
        emptyMessage="No projects found."
      />

      {/* Create Project Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Project" maxWidth="max-w-xl">
        <ProjectForm
          clients={clients}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          isPending={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
