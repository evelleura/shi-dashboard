import { useState, type FormEvent } from 'react';
import { useSubmitReport, useReports } from '../hooks/useDashboard';
import { useMyProjects } from '../hooks/useProjects';

export default function ReportPage() {
  const { data: projects = [], isLoading: loadingProjects } = useMyProjects();
  const { data: reports = [], isLoading: loadingReports } = useReports();
  const { mutateAsync: submitReport, isPending, isError, isSuccess, error } = useSubmitReport();

  const [form, setForm] = useState({
    project_id: '',
    report_date: new Date().toISOString().split('T')[0],
    progress_percentage: '',
    constraints: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.project_id || !form.progress_percentage) return;

    await submitReport({
      project_id: parseInt(form.project_id),
      report_date: form.report_date,
      progress_percentage: parseFloat(form.progress_percentage),
      constraints: form.constraints || undefined,
    });

    setForm((prev) => ({ ...prev, progress_percentage: '', constraints: '' }));
  };

  const errorMsg = isError && error instanceof Error ? error.message : 'Failed to submit report. Please try again.';

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Report</h1>
        <p className="text-sm text-gray-500">Submit your daily project progress</p>
      </div>

      {/* Report Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Report</h2>

        {isSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm" role="status">
            Report submitted successfully. SPI has been updated.
          </div>
        )}

        {isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="report-project" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              id="report-project"
              name="project_id"
              value={form.project_id}
              onChange={handleChange}
              required
              disabled={loadingProjects}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {projects.length === 0 && !loadingProjects && (
              <p className="text-xs text-gray-400 mt-1">No projects assigned to you yet.</p>
            )}
          </div>

          <div>
            <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
            <input
              id="report-date"
              type="date"
              name="report_date"
              value={form.report_date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="report-progress" className="block text-sm font-medium text-gray-700 mb-1">
              Progress Percentage (0-100)
            </label>
            <div className="relative">
              <input
                id="report-progress"
                type="number"
                name="progress_percentage"
                value={form.progress_percentage}
                onChange={handleChange}
                required
                min={0}
                max={100}
                step={0.1}
                placeholder="e.g. 45.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              />
              <span className="absolute right-3 top-2 text-sm text-gray-400" aria-hidden="true">%</span>
            </div>
          </div>

          <div>
            <label htmlFor="report-constraints" className="block text-sm font-medium text-gray-700 mb-1">Constraints / Notes</label>
            <textarea
              id="report-constraints"
              name="constraints"
              value={form.constraints}
              onChange={handleChange}
              rows={3}
              placeholder="Describe any obstacles or issues encountered..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {isPending ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">My Recent Reports</h2>
        {loadingReports ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No reports yet.</p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.project_name}</p>
                  <p className="text-xs text-gray-400">{new Date(r.report_date).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{Number(r.progress_percentage).toFixed(1)}%</p>
                  {r.constraints && <p className="text-xs text-gray-400 max-w-32 truncate">{r.constraints}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
