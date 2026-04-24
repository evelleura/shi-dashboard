import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../hooks/useDashboard';
import SummaryCards from '../components/dashboard/SummaryCards';
import ProjectHealthGrid from '../components/dashboard/ProjectHealthGrid';
import ProjectHealthPieChart from '../components/charts/ProjectHealthPieChart';
import TasksByStatusChart from '../components/charts/TasksByStatusChart';
import TasksByOwnerChart from '../components/charts/TasksByOwnerChart';
import TasksByDueDateChart from '../components/charts/TasksByDueDateChart';
import OverdueTasksChart from '../components/charts/OverdueTasksChart';
import BudgetStatusChart from '../components/charts/BudgetStatusChart';
import ProjectCategoryPieChart from '../components/charts/ProjectCategoryPieChart';
import TechnicianWorkloadChart from '../components/charts/TechnicianWorkloadChart';
import SPITrendChart from '../components/charts/SPITrendChart';
import RecentActivityFeed from '../components/charts/RecentActivityFeed';
import QuickActionsBar from '../components/dashboard/QuickActionsBar';
import DateRangePicker from '../components/ui/DateRangePicker';
import Modal from '../components/ui/Modal';
import ProjectForm from '../components/projects/ProjectForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createProject, createClient } from '../services/api';
import type { DateRange, CreateProjectData } from '../types';

type Filter = 'all' | 'red' | 'amber' | 'green' | 'none';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', address: '', phone: '', email: '' });

  const queryClient = useQueryClient();
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: getClients, staleTime: 1000 * 60 * 5 });
  const projectMutation = useMutation({
    mutationFn: (d: CreateProjectData) => createProject(d),
    onSuccess: () => { setShowProjectModal(false); void queryClient.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
  const clientMutation = useMutation({
    mutationFn: () => createClient(clientForm),
    onSuccess: () => { setShowClientModal(false); setClientForm({ name: '', address: '', phone: '', email: '' }); void queryClient.invalidateQueries({ queryKey: ['clients'] }); },
  });

  const handleDateChange = useCallback((start: string, end: string) => {
    setDateRange(start && end ? { start, end } : undefined);
  }, []);

  const filterButtons: { label: string; value: Filter; color: string }[] = [
    { label: 'All', value: 'all', color: 'bg-gray-100 text-gray-700' },
    { label: 'Critical', value: 'red', color: 'bg-red-100 text-red-700' },
    { label: 'Warning', value: 'amber', color: 'bg-yellow-100 text-yellow-700' },
    { label: 'On Track', value: 'green', color: 'bg-green-100 text-green-700' },
    { label: 'No Data', value: 'none', color: 'bg-gray-100 text-gray-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading dashboard">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Failed to load dashboard data.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Date Range Picker */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">PT Smart Home Inovasi Yogyakarta -- Real-time project health monitoring</p>
        </div>
        <DateRangePicker
          startDate={dateRange?.start ?? ''}
          endDate={dateRange?.end ?? ''}
          onChange={handleDateChange}
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsBar
        onNewProject={() => setShowProjectModal(true)}
        onNewClient={() => setShowClientModal(true)}
      />

      {/* Escalation Alert Banner */}
      {((data.summary.open_escalations ?? 0) > 0 || (data.summary.in_review_escalations ?? 0) > 0) && (
        <button
          onClick={() => router.push('/escalations')}
          className="w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-left"
          aria-label="View open escalations"
        >
          <div className="shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {(data.summary.open_escalations ?? 0) > 0
                ? `${data.summary.open_escalations} open escalation${(data.summary.open_escalations ?? 0) > 1 ? 's' : ''} need attention`
                : ''}
              {(data.summary.open_escalations ?? 0) > 0 && (data.summary.in_review_escalations ?? 0) > 0 ? ' -- ' : ''}
              {(data.summary.in_review_escalations ?? 0) > 0
                ? `${data.summary.in_review_escalations} in review`
                : ''}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Click to manage escalations</p>
          </div>
          <svg className="w-5 h-5 text-red-400 dark:text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* KPI Summary Cards */}
      <SummaryCards summary={data.summary} />

      {/* Charts Row 1: Health Pie + Task Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectHealthPieChart summary={data.summary} />
        <TasksByStatusChart />
      </div>

      {/* Charts Row 2: Project Category + Technician Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectCategoryPieChart dateRange={dateRange} />
        <TechnicianWorkloadChart dateRange={dateRange} />
      </div>

      {/* Charts Row 3: Tasks by Owner + Tasks by Due Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TasksByOwnerChart />
        <TasksByDueDateChart />
      </div>

      {/* Charts Row 4: Overdue + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OverdueTasksChart />
        <BudgetStatusChart />
      </div>

      {/* SPI Trend (full width) */}
      <SPITrendChart dateRange={dateRange} />

      {/* Recent Activity Feed (full width) */}
      <RecentActivityFeed dateRange={dateRange} />

      {/* Project Health Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects Overview</h2>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === btn.value
                    ? btn.color + ' ring-2 ring-offset-1 ring-current'
                    : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {btn.label}
                {btn.value === 'all' && ` (${data.summary.active_projects})`}
                {btn.value === 'red' && ` (${data.summary.total_red})`}
                {btn.value === 'amber' && ` (${data.summary.total_amber})`}
                {btn.value === 'green' && ` (${data.summary.total_green})`}
                {btn.value === 'none' && ` (${data.summary.total_no_health})`}
              </button>
            ))}
          </div>
        </div>
        <ProjectHealthGrid projects={data.projects} filter={filter} />
      </div>

      {/* New Project Modal */}
      <Modal open={showProjectModal} onClose={() => setShowProjectModal(false)} title="New Project">
        <ProjectForm
          clients={clients ?? []}
          onSubmit={async (d) => { await projectMutation.mutateAsync(d); }}
          onCancel={() => setShowProjectModal(false)}
          isPending={projectMutation.isPending}
        />
      </Modal>

      {/* New Client Modal */}
      <Modal open={showClientModal} onClose={() => setShowClientModal(false)} title="New Client">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={clientForm.name}
              onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Client name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input
              type="text"
              value={clientForm.address}
              onChange={(e) => setClientForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Client address"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                type="text"
                value={clientForm.phone}
                onChange={(e) => setClientForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="08xxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="client@email.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowClientModal(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => clientMutation.mutate()}
              disabled={clientMutation.isPending || !clientForm.name.trim()}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {clientMutation.isPending ? 'Saving...' : 'Create Client'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
