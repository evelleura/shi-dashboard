import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import ProjectForm from '../components/projects/ProjectForm';
import type { DashboardProject, CreateProjectData } from '../types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading, isError } = useProjects();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateProject();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = (projects as DashboardProject[]).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SPI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    No projects found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const dp = p as DashboardProject;
                  const tasksDone = dp.total_tasks > 0
                    ? `${dp.completed_tasks}/${dp.total_tasks}`
                    : '--';
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <Link to={`/projects/${p.id}`} className="font-medium text-sm text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {p.name}
                        </Link>
                        {p.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.client_name ?? '--'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.phase === 'survey' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {p.phase === 'survey' ? 'Survey' : 'Execution'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={dp.health_status ?? null} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {dp.spi_value != null ? Number(dp.spi_value).toFixed(3) : '--'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tasksDone}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(p.start_date)} -- {formatDate(p.end_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Number(p.project_value) > 0
                          ? `Rp ${Number(p.project_value).toLocaleString('id-ID')}`
                          : '--'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
