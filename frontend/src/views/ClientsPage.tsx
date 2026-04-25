import { useState, useMemo } from 'react';
import { useClients, useCreateClient, useDeleteClient } from '../hooks/useClients';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import DataTable, { type Column, type RowAge } from '../components/ui/DataTable';
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

export default function ClientsPage() {
  const { data: clients = [], isLoading, isError } = useClients();
  const createMutation = useCreateClient();
  const deleteMutation = useDeleteClient();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<CreateClientData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
  });

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
      label: 'Name',
      render: (c) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
          {c.notes && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{c.notes}</p>}
        </div>
      ),
      sortValue: (c) => c.name.toLowerCase(),
      exportValue: (c) => c.name,
    },
    {
      key: 'email',
      label: 'Email',
      render: (c) => <span className="text-sm text-gray-600 dark:text-gray-400">{c.email ?? '--'}</span>,
      sortValue: (c) => (c.email ?? '').toLowerCase(),
      exportValue: (c) => c.email ?? '',
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (c) => <span className="text-sm text-gray-600 dark:text-gray-400">{c.phone ?? '--'}</span>,
      exportValue: (c) => c.phone ?? '',
    },
    {
      key: 'project_count',
      label: 'Projects',
      align: 'center' as const,
      render: (c) => <span className="text-sm text-gray-600 dark:text-gray-400">{c.project_count ?? 0}</span>,
      sortValue: (c) => c.project_count ?? 0,
      exportValue: (c) => c.project_count ?? 0,
    },
    {
      key: 'address',
      label: 'Address',
      render: (c) => <span className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate block">{c.address ?? '--'}</span>,
      exportValue: (c) => c.address ?? '',
      cellClass: 'max-w-xs',
    },
    // Export-only columns
    {
      key: 'notes',
      label: 'Notes',
      exportOnly: true,
      exportValue: (c) => c.notes ?? '',
    },
  ], []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createMutation.mutateAsync({
      ...form,
      name: form.name.trim(),
      address: form.address?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    });
    setForm({ name: '', address: '', phone: '', email: '', notes: '' });
    setShowCreate(false);
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
    return <p className="text-center text-red-500 text-sm py-16">Failed to load clients.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Client
        </button>
      </div>

      <input
        type="search"
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Search clients"
      />

      {filtered.length === 0 && clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Add your first client to get started."
          action={{ label: '+ New Client', onClick: () => setShowCreate(true) }}
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
          emptyMessage="No clients match your search."
          actionColumn={{
            render: (c) => (
              <button
                onClick={() => setDeleteId(c.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
                aria-label={`Delete ${c.name}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ),
          }}
        />
      )}

      {/* Create Client Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Client">
        <div className="space-y-4">
          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              id="client-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              placeholder="Client name"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              id="client-email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="client@example.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              id="client-phone"
              type="text"
              value={form.phone ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+62812xxxx"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="client-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea
              id="client-address"
              value={form.address ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              rows={2}
              placeholder="Client address..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label htmlFor="client-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              id="client-notes"
              value={form.notes ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Additional notes..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? Projects linked to this client will have their client reference removed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
