import { useState, type FormEvent } from 'react';
import { useSubmitReport } from '../../hooks/useDashboard';
import { useMyProjects } from '../../hooks/useProjects';

interface Props {
  onSuccess?: () => void;
}

export default function DailyReportForm({ onSuccess }: Props) {
  const { data: projects = [], isLoading: loadingProjects } = useMyProjects();
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
    onSuccess?.();
  };

  const errorMsg = isError && error instanceof Error ? error.message : 'Failed to submit report';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Daily Report</h2>

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
          <label htmlFor="drf-project" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            id="drf-project"
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
            <p className="text-xs text-gray-400 mt-1">No projects assigned to you.</p>
          )}
        </div>

        <div>
          <label htmlFor="drf-date" className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
          <input
            id="drf-date"
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
          <label htmlFor="drf-progress" className="block text-sm font-medium text-gray-700 mb-1">
            Progress Percentage (0-100)
          </label>
          <div className="relative">
            <input
              id="drf-progress"
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
          <label htmlFor="drf-constraints" className="block text-sm font-medium text-gray-700 mb-1">Constraints / Notes</label>
          <textarea
            id="drf-constraints"
            name="constraints"
            value={form.constraints}
            onChange={handleChange}
            rows={3}
            placeholder="Describe any obstacles or constraints encountered..."
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
  );
}
