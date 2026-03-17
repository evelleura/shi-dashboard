import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useDashboard';
import StatusBadge from '../components/ui/StatusBadge';
import CreateProjectForm from '../components/forms/CreateProjectForm';
import type { DashboardProject } from '../types';

export default function ProjectsPage() {
  const { data: projects = [], isLoading, isError } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) as DashboardProject[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
          onClick={() => setShowCreate((s) => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h2>
          <CreateProjectForm
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      <input
        type="search"
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SPI</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/projects/${p.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                    {p.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize text-gray-600">{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.health_status ?? null} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.spi_value != null ? p.spi_value.toFixed(3) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(p.end_date).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
