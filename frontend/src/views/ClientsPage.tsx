import { useState, useMemo, useRef } from 'react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useUploadClientPhoto, useClient } from '../hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../services/api';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import DataTable, { type Column, type RowAge } from '../components/ui/DataTable';
import MapPreview from '../components/ui/MapPreview';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import type { Client, CreateClientData } from '../types';

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

function ClientDetailModal({ clientId, onClose }: { clientId: number; onClose: () => void }) {
  const { data: client, isLoading } = useClient(clientId);
  const uploadPhotoMutation = useUploadClientPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const { data: auditData } = useQuery({
    queryKey: ['audit', 'client', clientId],
    queryFn: () => getAuditLogs({ entity_type: 'client', entity_id: clientId, limit: 50 }),
    enabled: clientId > 0,
    staleTime: 1000 * 30,
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPhotoMutation.mutateAsync({ id: clientId, file });
  };

  if (isLoading) {
    return (
      <Modal open onClose={onClose} title={t('client.detail_title', language)}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Modal>
    );
  }

  if (!client) return null;

  const clientWithProjects = client as Client & { projects?: { id: number; name: string; status: string; phase: string; health_status?: string }[] };
  const hasCoords = client.latitude != null && client.longitude != null;

  return (
    <Modal open onClose={onClose} title={client.name} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Profile section */}
        <div className="flex gap-4 items-start">
          <div className="shrink-0">
            {client.photo_path ? (
              <img
                src={client.photo_path}
                alt={client.name}
                className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
              className="mt-2 w-24 text-xs text-center py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded transition-colors"
            >
              {uploadPhotoMutation.isPending ? t('client.uploading', language) : t('client.upload_photo', language)}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{client.name}</h3>
            {client.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {client.email}
              </p>
            )}
            {client.phone && (
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {client.phone}
              </p>
            )}
            {client.address && (
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {client.address}
              </p>
            )}
            {client.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">{client.notes}</p>
            )}
          </div>
        </div>

        {/* Map */}
        {hasCoords && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('client.location', language)}</h4>
            <MapPreview lat={Number(client.latitude)} lng={Number(client.longitude)} height="200px" />
            <p className="text-xs text-gray-400 mt-1">{Number(client.latitude).toFixed(6)}, {Number(client.longitude).toFixed(6)}</p>
          </div>
        )}

        {/* Projects */}
        {clientWithProjects.projects && clientWithProjects.projects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('project.title', language)} ({clientWithProjects.projects.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {clientWithProjects.projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      p.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {p.status}
                    </span>
                    {p.health_status && (
                      <span className={`w-2 h-2 rounded-full ${p.health_status === 'green' ? 'bg-green-500' : p.health_status === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {auditData && auditData.logs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('client.history', language)}</h4>
            <div className="relative space-y-3 max-h-56 overflow-y-auto pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              {auditData.logs.map((log) => (
                <div key={log.id} className="relative pl-4">
                  <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-blue-400 bg-white dark:bg-gray-900" />
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      log.action === 'create' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      log.action === 'delete' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {log.action === 'create' ? t('audit.created', language) : log.action === 'delete' ? t('audit.deleted', language) : t('audit.updated', language)}
                    </span>
                    {log.field_name && log.field_name !== '*' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{log.field_name}</span>
                        {log.old_value != null && <span className="text-red-500 line-through ml-1">{log.old_value}</span>}
                        {log.new_value != null && <span className="text-green-600 ml-1">→ {log.new_value}</span>}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('audit.by', language)} <span className="font-medium">{log.changed_by_name}</span></span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
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
  const { language } = useLanguage();

  const set = (key: keyof CreateClientData, value: string | number | null) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await onSubmit({
      ...form,
      name: form.name.trim(),
      address: form.address?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      latitude: form.latitude != null && form.latitude !== ('' as unknown) ? Number(form.latitude) : null,
      longitude: form.longitude != null && form.longitude !== ('' as unknown) ? Number(form.longitude) : null,
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.phone', language)}</label>
            <input type="text" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+62812xxxx" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.address', language)}</label>
          <textarea value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} rows={2} placeholder={t('client.address_placeholder', language)} className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
            <input type="number" step="any" value={form.latitude ?? ''} onChange={(e) => set('latitude', e.target.value ? parseFloat(e.target.value) : null)} placeholder="-7.797068" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
            <input type="number" step="any" value={form.longitude ?? ''} onChange={(e) => set('longitude', e.target.value ? parseFloat(e.target.value) : null)} placeholder="110.370529" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.notes', language)}</label>
          <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder={t('client.notes_placeholder', language)} className={`${inputClass} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('action.cancel', language)}
          </button>
          <button type="button" onClick={handleSubmit} disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            {isPending ? t('action.saving', language) : t('action.save', language)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ClientsPage() {
  const { data: clients = [], isLoading, isError } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const { language } = useLanguage();

  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
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
        <button onClick={() => setDetailId(c.id)} className="text-left group">
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

      {/* Detail Modal */}
      {detailId !== null && (
        <ClientDetailModal clientId={detailId} onClose={() => setDetailId(null)} />
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
