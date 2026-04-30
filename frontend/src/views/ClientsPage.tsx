import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import DataTable, { type Column, type RowAge } from '../components/ui/DataTable';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import type { Client, CreateClientData } from '../types';
import MapPreview from '../components/ui/MapPreview';
import { resolveGmapsUrl } from '../services/api';

function getClientAge(c: Client): RowAge {
  const created = c.created_at ? new Date(c.created_at).getTime() : 0;
  const updated = c.updated_at ? new Date(c.updated_at).getTime() : created;
  const latest = Math.max(created, updated);
  const now = Date.now();
  const hoursAgo = (now - latest) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 'new';
  if (hoursAgo < 24 * 7) return 'recent';
  if (hoursAgo > 24 * 30 && (c.project_count ?? 0) === 0) return 'stale';
  return 'normal';
}

const emptyForm: CreateClientData = { name: '', address: '', phone: '', email: '', notes: '', latitude: null, longitude: null };


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

function coordsToGmapsLink(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null) return '';
  return `https://www.google.com/maps?q=${lat},${lng}`;
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

function ClientFormModal({
  open,
  onClose,
  title,
  initialData,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialData: CreateClientData;
  onSubmit: (data: CreateClientData) => Promise<void>;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CreateClientData>(initialData);
  const [gmapsLink, setGmapsLink] = useState(() => coordsToGmapsLink(initialData.latitude, initialData.longitude));
  const { language } = useLanguage();

  const set = (key: keyof CreateClientData, value: string | number | null) =>
    setForm((p) => ({ ...p, [key]: value }));

  const { lat: coordLat, lng: coordLng, resolving } = useGmapsCoords(gmapsLink);
  const hasValidCoords = coordLat !== null;

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone?.trim()) return;
    await onSubmit({
      ...form,
      name: form.name.trim(),
      address: form.address?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      latitude: coordLat,
      longitude: coordLng,
    });
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.name', language)} *</label>
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('client.name_placeholder', language)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.email', language)}</label>
            <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="klien@example.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.phone', language)} <span className="text-red-500">*</span></label>
            <div className="flex gap-1.5">
              <input type="text" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+62812xxxx" className={inputClass} />
              {form.phone?.trim() && (
                <a
                  href={`https://wa.me/${form.phone.trim().replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat via WhatsApp"
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.address', language)}</label>
          <textarea value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} rows={2} placeholder={t('client.address_placeholder', language)} className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Link Google Maps
          </label>
          <div className="flex gap-1.5">
            <input
              type="url"
              value={gmapsLink}
              onChange={(e) => setGmapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className={inputClass}
            />
            {gmapsLink.trim() && (
              <a
                href={gmapsLink.trim()}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka di Google Maps"
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </a>
            )}
          </div>
          {gmapsLink.trim() && (
            <p className={`text-xs mt-1 ${resolving ? 'text-gray-400 dark:text-gray-500' : hasValidCoords ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {resolving
                ? '⏳ Memuat koordinat dari link...'
                : hasValidCoords
                  ? `✓ Koordinat terdeteksi: ${coordLat?.toFixed(5)}, ${coordLng?.toFixed(5)}`
                  : '⚠ Koordinat tidak terdeteksi dari link ini'}
            </p>
          )}
          {hasValidCoords && coordLat !== null && coordLng !== null && (
            <div className="mt-2">
              <MapPreview lat={coordLat} lng={coordLng} height="200px" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.notes', language)}</label>
          <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder={t('client.notes_placeholder', language)} className={`${inputClass} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('action.cancel', language)}
          </button>
          <button type="button" onClick={handleSubmit} disabled={isPending || !form.name.trim() || !form.phone?.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            {isPending ? t('action.saving', language) : t('action.save', language)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { data: clients = [], isLoading, isError } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const { language } = useLanguage();

  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    clients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase())
    ),
  [clients, search]);

  const columns: Column<Client>[] = useMemo(() => [
    {
      key: 'id',
      label: 'ID',
      defaultHidden: true,
      render: (c) => <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{c.id}</span>,
      sortValue: (c) => c.id,
      exportValue: (c) => c.id,
    },
    {
      key: 'name',
      label: t('label.name', language),
      render: (c) => (
        <button onClick={() => router.push('/clients/' + c.id)} className="text-left group">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">{c.name}</p>
          {c.notes && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{c.notes}</p>}
        </button>
      ),
      sortValue: (c) => c.name.toLowerCase(),
      exportValue: (c) => c.name,
    },
    {
      key: 'email',
      label: t('label.email', language),
      render: (c) => <span className="text-sm text-gray-600 dark:text-gray-400">{c.email ?? '--'}</span>,
      sortValue: (c) => (c.email ?? '').toLowerCase(),
      exportValue: (c) => c.email ?? '',
    },
    {
      key: 'phone',
      label: t('label.phone', language),
      render: (c) => <span className="text-sm text-gray-600 dark:text-gray-400">{c.phone ?? '--'}</span>,
      exportValue: (c) => c.phone ?? '',
    },
    {
      key: 'project_count',
      label: t('project.title', language),
      align: 'center' as const,
      render: (c) => <span className="text-sm text-gray-600 dark:text-gray-400">{c.project_count ?? 0}</span>,
      sortValue: (c) => c.project_count ?? 0,
      exportValue: (c) => c.project_count ?? 0,
    },
    {
      key: 'address',
      label: t('label.address', language),
      render: (c) => <span className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate block">{c.address ?? '--'}</span>,
      exportValue: (c) => c.address ?? '',
      cellClass: 'max-w-xs',
    },
    {
      key: 'latitude',
      label: language === 'id' ? 'Koordinat' : 'Coordinates',
      defaultHidden: true,
      render: (c) => c.latitude != null ? (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{Number(c.latitude).toFixed(5)}, {Number(c.longitude).toFixed(5)}</span>
      ) : <span className="text-gray-400">--</span>,
      exportValue: (c) => c.latitude != null ? `${c.latitude}, ${c.longitude}` : '',
    },
    {
      key: 'notes',
      label: t('label.notes', language),
      exportOnly: true,
      exportValue: (c) => c.notes ?? '',
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [language]);

  const handleCreate = async (data: CreateClientData) => {
    await createMutation.mutateAsync(data);
    setShowCreate(false);
  };

  const handleEdit = async (data: CreateClientData) => {
    if (!editClient) return;
    await updateMutation.mutateAsync({ id: editClient.id, data });
    setEditClient(null);
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500 text-sm py-16">{t('projects.failed_load_clients', language)}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('client.title', language)}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + {t('client.add', language)}
        </button>
      </div>

      <input
        type="search"
        placeholder={t('client.search_placeholder', language)}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('client.search_placeholder', language)}
      />

      {filtered.length === 0 && clients.length === 0 ? (
        <EmptyState
          title={t('client.no_clients_title', language)}
          description={t('client.no_clients_desc', language)}
          action={{ label: `+ ${t('client.add', language)}`, onClick: () => setShowCreate(true) }}
        />
      ) : (
        <DataTable<Client>
          columns={columns}
          data={filtered}
          rowKey={(c) => c.id}
          rowAge={getClientAge}
          defaultSortKey="created_at"
          defaultSortDesc={true}
          exportFileName="clients"
          emptyMessage={t('client.no_match', language)}
          actionColumn={{
            render: (c) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditClient(c)}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                  aria-label={`${t('action.edit', language)} ${c.name}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteId(c.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  aria-label={`${t('action.delete', language)} ${c.name}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ),
          }}
        />
      )}

      {/* Create Modal */}
      <ClientFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`${t('action.create', language)} ${t('client.title', language)}`}
        initialData={emptyForm}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      {/* Edit Modal */}
      {editClient && (
        <ClientFormModal
          open={true}
          onClose={() => setEditClient(null)}
          title={`${t('action.edit', language)}: ${editClient.name}`}
          initialData={{
            name: editClient.name,
            address: editClient.address ?? '',
            phone: editClient.phone ?? '',
            email: editClient.email ?? '',
            notes: editClient.notes ?? '',
            latitude: editClient.latitude ?? null,
            longitude: editClient.longitude ?? null,
          }}
          onSubmit={handleEdit}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('client.delete_title', language)}
        message={t('client.delete_message', language)}
        confirmLabel={t('action.delete', language)}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
