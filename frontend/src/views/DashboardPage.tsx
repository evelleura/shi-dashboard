import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../hooks/useDashboard';
import SummaryCards from '../components/dashboard/SummaryCards';
import ProjectHealthGrid from '../components/dashboard/ProjectHealthGrid';
import ProjectHealthPieChart from '../components/charts/ProjectHealthPieChart';
import TasksByStatusChart from '../components/charts/TasksByStatusChart';
import TasksByOwnerChart from '../components/charts/TasksByOwnerChart';
import TasksByDueDateChart from '../components/charts/TasksByDueDateChart';
import OverdueTasksChart from '../components/charts/OverdueTasksChart';
import ProjectCategoryPieChart from '../components/charts/ProjectCategoryPieChart';
import TechnicianWorkloadChart from '../components/charts/TechnicianWorkloadChart';
import SPITrendChart from '../components/charts/SPITrendChart';
import RecentActivityFeed from '../components/charts/RecentActivityFeed';
import QuickActionsBar from '../components/dashboard/QuickActionsBar';
import DateRangePicker from '../components/ui/DateRangePicker';
import Modal from '../components/ui/Modal';
import MapPreview from '../components/ui/MapPreview';
import ProjectForm from '../components/projects/ProjectForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createProject, createClient, resolveGmapsUrl } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { t } from '../lib/i18n';
import type { DateRange, CreateProjectData, CreateClientData } from '../types';

function parseGmapsLink(link: string): { lat: number | null; lng: number | null } {
  if (!link.trim()) return { lat: null, lng: null };
  const atMatch = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  const placeMatch = link.match(/\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  return { lat: null, lng: null };
}

function isShortened(url: string): boolean {
  return /goo\.gl|maps\.app/i.test(url);
}

function useGmapsCoords(gmapsLink: string) {
  const [resolved, setResolved] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [resolving, setResolving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync = parseGmapsLink(gmapsLink);
  const hasSyncCoords = sync.lat !== null;

  useEffect(() => {
    if (!gmapsLink.trim() || hasSyncCoords) {
      setResolved({ lat: null, lng: null });
      return;
    }
    if (!isShortened(gmapsLink)) {
      setResolved({ lat: null, lng: null });
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setResolving(true);
      try {
        const result = await resolveGmapsUrl(gmapsLink.trim());
        setResolved(result.coords ?? { lat: null, lng: null });
      } catch {
        setResolved({ lat: null, lng: null });
      } finally {
        setResolving(false);
      }
    }, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [gmapsLink, hasSyncCoords]);

  const lat = hasSyncCoords ? sync.lat : resolved.lat;
  const lng = hasSyncCoords ? sync.lng : resolved.lng;
  return { lat, lng, resolving };
}

const emptyClientForm: CreateClientData & { gmapsLink: string } = {
  name: '', address: '', phone: '', email: '', notes: '', latitude: null, longitude: null, gmapsLink: '',
};

type Filter = 'all' | 'red' | 'amber' | 'green' | 'none';

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [filter, setFilter] = useState<Filter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { data, isLoading, isError, refetch } = useDashboard(dateRange);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const { lat: clientCoordLat, lng: clientCoordLng, resolving: clientResolving } = useGmapsCoords(clientForm.gmapsLink);
  const toast = useToast();

  const queryClient = useQueryClient();
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: getClients, staleTime: 1000 * 60 * 5 });
  const projectMutation = useMutation({
    mutationFn: (d: CreateProjectData) => createProject(d),
    onSuccess: () => { setShowProjectModal(false); void queryClient.invalidateQueries({ queryKey: ['dashboard'] as const, exact: false }); },
  });
  const clientMutation = useMutation({
    mutationFn: () => createClient({ ...clientForm, latitude: clientCoordLat, longitude: clientCoordLng }),
    onSuccess: () => {
      setShowClientModal(false);
      setClientForm(emptyClientForm);
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast('Klien baru berhasil ditambahkan');
    },
    onError: () => { toast('Gagal menambahkan klien', 'error'); },
  });

  const handleDateChange = useCallback((start: string, end: string) => {
    setDateRange(start && end ? { start, end } : undefined);
  }, []);

  const filterButtons: { label: string; value: Filter; color: string }[] = [
    { label: t('dashboard.filter_all', language), value: 'all', color: 'bg-gray-100 text-gray-700' },
    { label: t('dashboard.filter_critical', language), value: 'red', color: 'bg-red-100 text-red-700' },
    { label: t('dashboard.filter_warning', language), value: 'amber', color: 'bg-yellow-100 text-yellow-700' },
    { label: t('dashboard.filter_on_track', language), value: 'green', color: 'bg-green-100 text-green-700' },
    { label: t('dashboard.filter_no_data', language), value: 'none', color: 'bg-gray-100 text-gray-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label={t('dashboard.loading', language)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">{t('error.load_failed', language)}.</p>
        <button onClick={() => void refetch()} className="mt-2 text-blue-600 text-sm underline">{t('dashboard.retry', language)}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Date Range Picker */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title', language)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.subtitle', language)}</p>
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
                ? `${data.summary.open_escalations} ${t('dashboard.escalation_need_attention', language)}`
                : ''}
              {(data.summary.open_escalations ?? 0) > 0 && (data.summary.in_review_escalations ?? 0) > 0 ? ' -- ' : ''}
              {(data.summary.in_review_escalations ?? 0) > 0
                ? `${data.summary.in_review_escalations} ${t('dashboard.escalation_in_review', language)}`
                : ''}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{t('dashboard.escalation_click', language)}</p>
          </div>
          <svg className="w-5 h-5 text-red-400 dark:text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* KPI Summary Cards */}
      <SummaryCards summary={data.summary} onFilter={setFilter} activeFilter={filter} />

      {/* Charts Row 1: Health Pie + Task Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectHealthPieChart summary={data.summary} />
        <TasksByStatusChart dateRange={dateRange} />
      </div>

      {/* Charts Row 2: Project Category + Technician Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectCategoryPieChart dateRange={dateRange} />
        <TechnicianWorkloadChart dateRange={dateRange} />
      </div>

      {/* Charts Row 3: Tasks by Owner + Tasks by Due Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TasksByOwnerChart dateRange={dateRange} />
        <TasksByDueDateChart dateRange={dateRange} />
      </div>

      {/* Charts Row 4: Overdue */}
      <div className="grid grid-cols-1 gap-4">
        <OverdueTasksChart dateRange={dateRange} />
      </div>

      {/* SPI Trend (full width) */}
      <SPITrendChart dateRange={dateRange} />

      {/* Recent Activity Feed (full width) */}
      <RecentActivityFeed dateRange={dateRange} />

      {/* Project Health Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.projects_overview', language)}</h2>
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
      <Modal open={showProjectModal} onClose={() => setShowProjectModal(false)} title={t('project.new', language)}>
        <ProjectForm
          clients={clients ?? []}
          onSubmit={async (d) => { await projectMutation.mutateAsync(d); }}
          onCancel={() => setShowProjectModal(false)}
          isPending={projectMutation.isPending}
        />
      </Modal>

      {/* New Client Modal */}
      <Modal open={showClientModal} onClose={() => setShowClientModal(false)} title={t('client.new', language)}>
        {(() => {
          const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
          const hasValidCoords = clientCoordLat !== null;
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.name', language)} *</label>
                <input type="text" value={clientForm.name} onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('client.name_placeholder', language)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.email', language)}</label>
                  <input type="email" value={clientForm.email ?? ''} onChange={(e) => setClientForm((f) => ({ ...f, email: e.target.value }))} placeholder="klien@example.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.phone', language)}</label>
                  <div className="flex gap-1.5">
                    <input type="text" value={clientForm.phone ?? ''} onChange={(e) => setClientForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+62812xxxx" className={inputClass} />
                    {clientForm.phone?.trim() && (
                      <a href={`https://wa.me/${clientForm.phone.trim().replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="Chat via WhatsApp" className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-green-500 hover:bg-green-600 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.address', language)}</label>
                <textarea value={clientForm.address ?? ''} onChange={(e) => setClientForm((f) => ({ ...f, address: e.target.value }))} rows={2} placeholder={t('client.address_placeholder', language)} className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link Google Maps</label>
                <div className="flex gap-1.5">
                  <input type="url" value={clientForm.gmapsLink} onChange={(e) => setClientForm((f) => ({ ...f, gmapsLink: e.target.value }))} placeholder="https://maps.google.com/..." className={inputClass} />
                  {clientForm.gmapsLink.trim() && (
                    <a href={clientForm.gmapsLink.trim()} target="_blank" rel="noopener noreferrer" title="Buka di Google Maps" className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    </a>
                  )}
                </div>
                {clientForm.gmapsLink.trim() && (
                  <p className={`text-xs mt-1 ${clientResolving ? 'text-gray-400 dark:text-gray-500' : hasValidCoords ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {clientResolving
                      ? '⏳ Memuat koordinat dari link...'
                      : hasValidCoords
                        ? `✓ Koordinat terdeteksi: ${clientCoordLat?.toFixed(5)}, ${clientCoordLng?.toFixed(5)}`
                        : '⚠ Koordinat tidak terdeteksi dari link ini'}
                  </p>
                )}
                {hasValidCoords && clientCoordLat !== null && clientCoordLng !== null && (
                  <div className="mt-2">
                    <MapPreview lat={clientCoordLat} lng={clientCoordLng} height="200px" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.notes', language)}</label>
                <textarea value={clientForm.notes ?? ''} onChange={(e) => setClientForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder={t('client.notes_placeholder', language)} className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowClientModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {t('action.cancel', language)}
                </button>
                <button type="button" onClick={() => clientMutation.mutate()} disabled={clientMutation.isPending || !clientForm.name.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
                  {clientMutation.isPending ? t('action.saving', language) : t('action.save', language)}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
