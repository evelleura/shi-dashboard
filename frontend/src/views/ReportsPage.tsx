import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../hooks/useDashboard';
import { useProjects, useUpdateProject } from '../hooks/useProjects';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import * as XLSX from 'xlsx';
import type { DashboardProject, UpdateProjectData } from '../types';

type ReportType = 'summary' | 'health' | 'tasks' | 'budget';

const REPORT_TABS: { key: ReportType; label: string; icon: string }[] = [
  { key: 'summary', label: 'Project Summary', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'health', label: 'Health Status', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'tasks', label: 'Task Completion', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'budget', label: 'Budget Overview', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function HealthBadge({ status }: { status: string | null }) {
  const cls = status === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    : status === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    : status === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{status ?? 'N/A'}</span>;
}

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className="text-[11px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
    >
      <option value="active">Active</option>
      <option value="completed">Completed</option>
      <option value="on-hold">On Hold</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

function PhaseSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className="text-[11px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
    >
      <option value="survey">Survey</option>
      <option value="execution">Execution</option>
    </select>
  );
}

function ActionButtons({ project, onView, onEdit }: { project: DashboardProject; onView: () => void; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button onClick={onView} title="View Detail" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      <button onClick={onEdit} title="Quick Edit" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

function PrintButton({ contentRef }: { contentRef: React.RefObject<HTMLDivElement | null> }) {
  const handlePrint = () => {
    if (!contentRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>SHI Report</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 20px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        h1 { font-size: 18px; } h2 { font-size: 14px; margin-top: 24px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h1>PT Smart Home Inovasi - Report</h1>
      <p style="color:#666;font-size:12px">Generated: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      ${contentRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <button onClick={handlePrint} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 transition-colors">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print / PDF
    </button>
  );
}

export default function ReportsPage() {
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: projects = [], isLoading: projLoading } = useProjects();
  const updateMutation = useUpdateProject();
  const router = useRouter();
  const [tab, setTab] = useState<ReportType>('summary');
  const contentRef = useRef<HTMLDivElement>(null);

  // Edit modal state
  const [editProject, setEditProject] = useState<DashboardProject | null>(null);
  const [editForm, setEditForm] = useState({ name: '', status: '', phase: '', project_value: '' });

  const allProjects = projects as DashboardProject[];

  const openEdit = (p: DashboardProject) => {
    setEditProject(p);
    setEditForm({
      name: p.name,
      status: p.status,
      phase: p.phase,
      project_value: String(Number(p.project_value) || 0),
    });
  };

  const saveEdit = () => {
    if (!editProject) return;
    const data: UpdateProjectData = {};
    if (editForm.name !== editProject.name) data.name = editForm.name;
    if (editForm.status !== editProject.status) data.status = editForm.status as UpdateProjectData['status'];
    if (editForm.phase !== editProject.phase) data.phase = editForm.phase as UpdateProjectData['phase'];
    if (editForm.project_value !== String(Number(editProject.project_value) || 0)) data.project_value = Number(editForm.project_value);
    if (Object.keys(data).length > 0) {
      updateMutation.mutate({ id: editProject.id, data });
    }
    setEditProject(null);
  };

  const handleInlineStatusChange = (p: DashboardProject, newStatus: string) => {
    updateMutation.mutate({ id: p.id, data: { status: newStatus as UpdateProjectData['status'] } });
  };

  const handleInlinePhaseChange = (p: DashboardProject, newPhase: string) => {
    updateMutation.mutate({ id: p.id, data: { phase: newPhase as UpdateProjectData['phase'] } });
  };

  const handleExcelExport = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const summaryRows = allProjects.map((p) => ({
      'Project Code': p.project_code,
      'Project Name': p.name,
      'Client': p.client_name ?? '',
      'Status': p.status,
      'Phase': p.phase,
      'Health': p.health_status ?? 'N/A',
      'SPI': p.spi_value != null ? Number(p.spi_value).toFixed(3) : '',
      'Tasks Done': p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '',
      'Start Date': p.start_date,
      'End Date': p.end_date,
      'Value (Rp)': Number(p.project_value) || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Projects');
    if (dashData) {
      const healthRows = [
        { Metric: 'Total Active Projects', Value: dashData.summary.active_projects },
        { Metric: 'On Track (Green)', Value: dashData.summary.total_green },
        { Metric: 'Warning (Amber)', Value: dashData.summary.total_amber },
        { Metric: 'Critical (Red)', Value: dashData.summary.total_red },
        { Metric: 'Average SPI', Value: dashData.summary.avg_spi != null ? Number(dashData.summary.avg_spi).toFixed(4) : 'N/A' },
        { Metric: 'Total Tasks', Value: dashData.summary.total_tasks },
        { Metric: 'Completed Tasks', Value: dashData.summary.completed_tasks },
        { Metric: 'Overtime Tasks', Value: dashData.summary.overtime_tasks },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(healthRows), 'Health Summary');
    }
    XLSX.writeFile(wb, `SHI_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [allProjects, dashData]);

  if (dashLoading || projLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const summary = dashData?.summary;
  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click any row to view detail. Use dropdowns to change status/phase inline.</p>
        </div>
        <div className="flex items-center gap-2">
          {updateMutation.isPending && (
            <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              Saving...
            </span>
          )}
          <PrintButton contentRef={contentRef} />
          <button onClick={handleExcelExport} className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {REPORT_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Report content */}
      <div ref={contentRef}>
        {/* ── SUMMARY TAB ──────────────────────────────────────────────── */}
        {tab === 'summary' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">All Projects Summary</h2>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{allProjects.length} projects</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Code', 'Project', 'Client', 'Status', 'Phase', 'Health', 'SPI', 'Tasks', 'Timeline', 'Value', ''].map((h) => (
                      <th key={h} className={`px-3 py-2 font-medium text-gray-500 dark:text-gray-400 uppercase ${h === 'Value' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {allProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                      <td className="px-3 py-2.5 font-mono text-gray-500 dark:text-gray-400">{p.project_code}</td>
                      <td className="px-3 py-2.5 font-medium text-blue-600 dark:text-blue-400 max-w-[200px] truncate group-hover:underline">{p.name}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.client_name ?? '-'}</td>
                      <td className="px-3 py-2.5"><StatusSelect value={p.status} onChange={(v) => handleInlineStatusChange(p, v)} /></td>
                      <td className="px-3 py-2.5"><PhaseSelect value={p.phase} onChange={(v) => handleInlinePhaseChange(p, v)} /></td>
                      <td className="px-3 py-2.5"><HealthBadge status={p.health_status} /></td>
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 font-mono">{p.spi_value != null ? Number(p.spi_value).toFixed(3) : '-'}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '-'}</td>
                      <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(p.start_date)} — {formatDate(p.end_date)}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-right font-mono">{Number(p.project_value) > 0 ? formatRupiah(Number(p.project_value)) : '-'}</td>
                      <td className="px-3 py-2.5"><ActionButtons project={p} onView={() => router.push(`/projects/${p.id}`)} onEdit={() => openEdit(p)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HEALTH TAB ───────────────────────────────────────────────── */}
        {tab === 'health' && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Active', value: summary.active_projects, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                { label: 'On Track', value: summary.total_green, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
                { label: 'Warning', value: summary.total_amber, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
                { label: 'Critical', value: summary.total_red, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
                { label: 'Avg SPI', value: summary.avg_spi != null ? Number(summary.avg_spi).toFixed(3) : 'N/A', color: 'text-gray-900 dark:text-gray-100', bg: 'bg-gray-50 dark:bg-gray-800' },
              ].map((c) => (
                <div key={c.label} className={`${c.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center`}>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Health Status per Project</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {['Project', 'Health', 'SPI', 'Deviation', 'Actual', 'Planned', 'Tasks', ''].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {allProjects
                      .filter((p) => p.status === 'active')
                      .sort((a, b) => {
                        const order: Record<string, number> = { red: 0, amber: 1, green: 2 };
                        return (order[a.health_status ?? ''] ?? 3) - (order[b.health_status ?? ''] ?? 3);
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                          <td className="px-3 py-2.5 font-medium text-blue-600 dark:text-blue-400 group-hover:underline">{p.name}</td>
                          <td className="px-3 py-2.5"><HealthBadge status={p.health_status} /></td>
                          <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 font-mono">{p.spi_value != null ? Number(p.spi_value).toFixed(3) : '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.deviation_percent != null ? `${Number(p.deviation_percent).toFixed(1)}%` : '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.actual_progress != null ? `${Number(p.actual_progress).toFixed(1)}%` : '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.planned_progress != null ? `${Number(p.planned_progress).toFixed(1)}%` : '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '-'}</td>
                          <td className="px-3 py-2.5"><ActionButtons project={p} onView={() => router.push(`/projects/${p.id}`)} onEdit={() => openEdit(p)} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS TAB ────────────────────────────────────────────────── */}
        {tab === 'tasks' && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Tasks', value: summary.total_tasks, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                { label: 'Completed', value: summary.completed_tasks, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
                { label: 'In Progress', value: summary.in_progress_tasks + summary.working_tasks, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                { label: 'Overtime', value: summary.overtime_tasks, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
              ].map((c) => (
                <div key={c.label} className={`${c.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center`}>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Task Completion per Project</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {allProjects.filter((p) => p.total_tasks > 0).map((p) => {
                  const pct = Math.round((p.completed_tasks / p.total_tasks) * 100);
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate group-hover:underline">{p.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{p.completed_tasks} of {p.total_tasks} tasks</p>
                      </div>
                      <HealthBadge status={p.health_status} />
                      <div className="w-32 shrink-0">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BUDGET TAB ───────────────────────────────────────────────── */}
        {tab === 'budget' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Budget Overview</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Project', 'Client', 'Phase', 'Status', 'Project Value', ''].map((h) => (
                      <th key={h} className={`px-3 py-2 font-medium text-gray-500 dark:text-gray-400 uppercase ${h === 'Project Value' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {allProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                      <td className="px-3 py-2.5 font-medium text-blue-600 dark:text-blue-400 group-hover:underline">{p.name}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.client_name ?? '-'}</td>
                      <td className="px-3 py-2.5"><PhaseSelect value={p.phase} onChange={(v) => handleInlinePhaseChange(p, v)} /></td>
                      <td className="px-3 py-2.5"><StatusSelect value={p.status} onChange={(v) => handleInlineStatusChange(p, v)} /></td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">{Number(p.project_value) > 0 ? formatRupiah(Number(p.project_value)) : '-'}</td>
                      <td className="px-3 py-2.5"><ActionButtons project={p} onView={() => router.push(`/projects/${p.id}`)} onEdit={() => openEdit(p)} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 dark:border-gray-600">
                  <tr className="bg-gray-50 dark:bg-gray-900">
                    <td colSpan={4} className="px-3 py-2.5 font-semibold text-gray-900 dark:text-gray-100">Total Portfolio Value</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                      {formatRupiah(allProjects.reduce((s, p) => s + (Number(p.project_value) || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ───────────────────────────────────────────────── */}
      <Modal open={!!editProject} onClose={() => setEditProject(null)} title={`Edit: ${editProject?.name ?? ''}`}>
        {editProject && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phase</label>
                <select value={editForm.phase} onChange={(e) => setEditForm((f) => ({ ...f, phase: e.target.value }))} className={inputClass}>
                  <option value="survey">Survey</option>
                  <option value="execution">Execution</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Value (Rp)</label>
              <input type="number" value={editForm.project_value} onChange={(e) => setEditForm((f) => ({ ...f, project_value: e.target.value }))} className={inputClass} />
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => router.push(`/projects/${editProject.id}`)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Open Full Detail
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditProject(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                <button onClick={saveEdit} disabled={updateMutation.isPending} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
