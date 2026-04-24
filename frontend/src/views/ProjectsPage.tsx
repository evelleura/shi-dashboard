import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjects, useCreateProject, useUpdateProject } from '../hooks/useProjects';
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

function PencilIcon() {
  return (
    <svg
      className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/cell:opacity-100 shrink-0 transition-opacity"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading, isError } = useProjects();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);

  const startEdit = (id: number, field: string) => {
    setEditingCell({ id, field });
  };

  const saveEdit = (id: number, field: string, value: string) => {
    setEditingCell(null);
    updateMutation.mutate({
      id,
      data: { [field]: field === 'project_value' ? Number(value) : value },
    });
  };

  const filtered = useMemo(() =>
    (projects as DashboardProject[]).filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.client_name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
  [projects, search, statusFilter]);

  const columns: Column<DashboardProject>[] = useMemo(() => [
    {
      key: 'project_code',
      label: 'ID',
      render: (p) => (
        <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400">
          {p.project_code}
        </span>
      ),
      sortValue: (p) => p.project_code,
      exportValue: (p) => p.project_code,
      headerClass: 'w-24',
    },
    {
      key: 'name',
      label: 'Project',
      render: (p) => {
        const isEditing = editingCell?.id === p.id && editingCell?.field === 'name';
        if (isEditing) {
          return (
            <input
              autoFocus
              className="w-full px-2 py-1 text-sm border border-blue-400 rounded bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              defaultValue={p.name}
              onBlur={(e) => saveEdit(p.id, 'name', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(p.id, 'name', (e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
        return (
          <div
            className="group/cell flex items-start gap-1"
            onDoubleClick={(e) => { e.stopPropagation(); startEdit(p.id, 'name'); }}
            title="Double-click to edit"
          >
            <div className="min-w-0">
              <Link
                href={`/projects/${p.id}`}
                className="font-medium text-sm text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {p.name}
              </Link>
              {p.description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{p.description}</p>
              )}
            </div>
            <PencilIcon />
          </div>
        );
      },
      sortValue: (p) => p.name.toLowerCase(),
      exportValue: (p) => p.name,
    },
    {
      key: 'client_name',
      label: 'Client',
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{p.client_name ?? '--'}</span>
      ),
      sortValue: (p) => (p.client_name ?? '').toLowerCase(),
      exportValue: (p) => p.client_name ?? '',
    },
    {
      key: 'phase',
      label: 'Phase',
      render: (p) => {
        const isEditing = editingCell?.id === p.id && editingCell?.field === 'phase';
        if (isEditing) {
          return (
            <select
              autoFocus
              className="px-2 py-1 text-xs border border-blue-400 rounded bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              defaultValue={p.phase}
              onBlur={(e) => saveEdit(p.id, 'phase', e.target.value)}
              onChange={(e) => saveEdit(p.id, 'phase', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="survey">Survey</option>
              <option value="execution">Execution</option>
            </select>
          );
        }
        return (
          <div
            className="group/cell flex items-center gap-1"
            onDoubleClick={(e) => { e.stopPropagation(); startEdit(p.id, 'phase'); }}
            title="Double-click to edit"
          >
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              p.phase === 'survey' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            }`}>
              {p.phase === 'survey' ? 'Survey' : 'Execution'}
            </span>
            <PencilIcon />
          </div>
        );
      },
      sortValue: (p) => p.phase,
      exportValue: (p) => p.phase === 'survey' ? 'Survey' : 'Execution',
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => {
        const isEditing = editingCell?.id === p.id && editingCell?.field === 'status';
        if (isEditing) {
          return (
            <select
              autoFocus
              className="px-2 py-1 text-xs border border-blue-400 rounded bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              defaultValue={p.status}
              onBlur={(e) => saveEdit(p.id, 'status', e.target.value)}
              onChange={(e) => saveEdit(p.id, 'status', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          );
        }
        const statusStyles: Record<string, string> = {
          active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          'on-hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
          <div
            className="group/cell flex items-center gap-1"
            onDoubleClick={(e) => { e.stopPropagation(); startEdit(p.id, 'status'); }}
            title="Double-click to edit"
          >
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusStyles[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {p.status === 'on-hold' ? 'On Hold' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
            </span>
            <PencilIcon />
          </div>
        );
      },
      sortValue: (p) => p.status,
      exportValue: (p) => p.status,
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
      render: (p) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {p.spi_value != null ? Number(p.spi_value).toFixed(3) : '--'}
        </span>
      ),
      sortValue: (p) => p.spi_value ?? -1,
      exportValue: (p) => p.spi_value != null ? Number(p.spi_value).toFixed(3) : '',
    },
    {
      key: 'tasks',
      label: 'Tasks',
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '--'}
        </span>
      ),
      sortValue: (p) => p.total_tasks > 0 ? p.completed_tasks / p.total_tasks : -1,
      exportValue: (p) => p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '',
    },
    {
      key: 'timeline',
      label: 'Timeline',
      render: (p) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(p.start_date)} -- {formatDate(p.end_date)}
        </span>
      ),
      sortValue: (p) => p.start_date,
      exportValue: (p) => `${formatDate(p.start_date)} - ${formatDate(p.end_date)}`,
    },
    {
      key: 'project_value',
      label: 'Value',
      align: 'right' as const,
      render: (p) => {
        const isEditing = editingCell?.id === p.id && editingCell?.field === 'project_value';
        if (isEditing) {
          return (
            <input
              type="number"
              autoFocus
              className="w-32 px-2 py-1 text-sm border border-blue-400 rounded bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-right"
              defaultValue={Number(p.project_value) || 0}
              onBlur={(e) => saveEdit(p.id, 'project_value', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(p.id, 'project_value', (e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
        return (
          <div
            className="group/cell flex items-center justify-end gap-1"
            onDoubleClick={(e) => { e.stopPropagation(); startEdit(p.id, 'project_value'); }}
            title="Double-click to edit"
          >
            <PencilIcon />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Number(p.project_value) > 0 ? `Rp ${Number(p.project_value).toLocaleString('id-ID')}` : '--'}
            </span>
          </div>
        );
      },
      sortValue: (p) => Number(p.project_value) || 0,
      exportValue: (p) => Number(p.project_value) || 0,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [editingCell]);

  const handleCreate = async (data: CreateProjectData) => {
    await createMutation.mutateAsync(data);
    setShowCreate(false);
  };

  const handleRowClick = (p: DashboardProject) => {
    // Do not navigate if currently editing a cell in this row
    if (editingCell?.id === p.id) return;
    router.push(`/projects/${p.id}`);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
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
          className="w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search projects"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {updateMutation.isPending && (
          <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Saving...
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
        Tip: Double-click a cell in the Name, Phase, Status, or Value column to edit inline.
      </p>

      <DataTable<DashboardProject>
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        rowAge={getProjectAge}
        onRowClick={handleRowClick}
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
