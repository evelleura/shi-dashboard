import DailyReportForm from '../components/forms/DailyReportForm';
import { useReports } from '../hooks/useDashboard';

export default function ReportPage() {
  const { data: reports = [], isLoading } = useReports();

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Report</h1>
        <p className="text-sm text-gray-500">Submit your daily project progress</p>
      </div>

      <DailyReportForm />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">My Recent Reports</h2>
        {isLoading ? (
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
