import { useState, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetPassword, useDeactivateUser, useActivateUser } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import DataTable, { type Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';
import type { User, UserRole } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, string> = {
  admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  technician: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_BADGE[role] ?? ''}`}>
      {role}
    </span>
  );
}

function ActiveBadge({ isActive, language }: { isActive: boolean; language: string }) {
  return isActive ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
      {t('user.active', language as Parameters<typeof t>[1])}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
      {t('user.inactive', language as Parameters<typeof t>[1])}
    </span>
  );
}

const INPUT_CLASS =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const LABEL_CLASS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface EditForm {
  name: string;
  email: string;
  role: UserRole;
}

const EMPTY_CREATE: CreateForm = { name: '', email: '', password: '', role: 'technician' };
const EMPTY_EDIT: EditForm = { name: '', email: '', role: 'technician' };

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const { user: me } = useAuth();
  const { data: users = [], isLoading, isError } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resetMutation = useResetPassword();
  const deactivateMutation = useDeactivateUser();
  const activateMutation = useActivateUser();
  const { language } = useLanguage();

  const locale = language === 'id' ? 'id-ID' : 'en-US';

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [newPassword, setNewPassword] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Error states
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [resetError, setResetError] = useState('');

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, search, roleFilter]);

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        defaultHidden: true,
        render: (u) => <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{u.id}</span>,
        sortValue: (u) => u.id,
        exportValue: (u) => u.id,
      },
      {
        key: 'name',
        label: t('label.name', language),
        render: (u) => (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
        ),
        sortValue: (u) => u.name.toLowerCase(),
        exportValue: (u) => u.name,
      },
      {
        key: 'email',
        label: t('label.email', language),
        render: (u) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{u.email}</span>
        ),
        sortValue: (u) => u.email.toLowerCase(),
        exportValue: (u) => u.email,
      },
      {
        key: 'role',
        label: t('label.role', language),
        render: (u) => <RoleBadge role={u.role} />,
        sortValue: (u) => u.role,
        exportValue: (u) => u.role,
      },
      {
        key: 'is_active',
        label: t('label.status', language),
        render: (u) => <ActiveBadge isActive={u.is_active} language={language} />,
        sortValue: (u) => (u.is_active ? 1 : 0),
        exportValue: (u) => (u.is_active ? t('user.active', language) : t('user.inactive', language)),
      },
      {
        key: 'created_at',
        label: t('user.joined', language),
        render: (u) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {u.created_at
              ? new Date(u.created_at).toLocaleDateString(locale, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '--'}
          </span>
        ),
        sortValue: (u) => u.created_at ?? '',
        exportValue: (u) => u.created_at ?? '',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setCreateError('');
    if (!createForm.name.trim()) { setCreateError(t('user.name_required', language)); return; }
    if (!createForm.email.trim()) { setCreateError(t('user.email_required', language)); return; }
    if (createForm.password.length < 6) { setCreateError(t('user.pw_min_6', language)); return; }

    try {
      await createMutation.mutateAsync({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setCreateForm(EMPTY_CREATE);
      setShowCreate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('user.create_failed', language);
      setCreateError(msg);
    }
  };

  const openEdit = (u: User) => {
    setEditForm({ name: u.name, email: u.email, role: u.role });
    setEditError('');
    setEditUser(u);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setEditError('');
    if (!editForm.name.trim()) { setEditError(t('user.name_required', language)); return; }
    if (!editForm.email.trim()) { setEditError(t('user.email_required', language)); return; }

    try {
      await updateMutation.mutateAsync({
        id: editUser.id,
        data: {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
        },
      });
      setEditUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('user.update_failed', language);
      setEditError(msg);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const openResetPassword = () => {
    setNewPassword('');
    setResetError('');
    setShowResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!editUser) return;
    setResetError('');
    if (newPassword.length < 6) { setResetError(t('user.pw_min_6', language)); return; }

    try {
      await resetMutation.mutateAsync({ id: editUser.id, password: newPassword });
      setShowResetModal(false);
      setNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('user.reset_failed', language);
      setResetError(msg);
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label={language === 'id' ? 'Memuat pengguna' : 'Loading users'}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 text-sm py-16">{t('error.load_failed', language)}.</p>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('user.management', language)}</h1>
        <button
          onClick={() => { setCreateForm(EMPTY_CREATE); setCreateError(''); setShowCreate(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {t('action.new_user', language)}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder={t('user.search_placeholder', language)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('user.search_placeholder', language)}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-40 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={language === 'id' ? 'Filter berdasarkan peran' : 'Filter by role'}
        >
          <option value="all">{t('user.all_roles', language)}</option>
          <option value="admin">{t('role.admin', language)}</option>
          <option value="manager">{t('role.manager', language)}</option>
          <option value="technician">{t('role.technician', language)}</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 && users.length === 0 ? (
        <EmptyState
          title={t('user.no_users_title', language)}
          description={t('user.no_users_desc', language)}
          action={{ label: t('action.new_user', language), onClick: () => { setCreateForm(EMPTY_CREATE); setCreateError(''); setShowCreate(true); } }}
        />
      ) : (
        <DataTable<User>
          columns={columns}
          data={filtered}
          rowKey={(u) => u.id}
          onRowClick={openEdit}
          rowClass={(u) => (u.is_active ? '' : 'opacity-50')}
          defaultSortKey="created_at"
          defaultSortDesc={true}
          exportFileName="users"
          emptyMessage={t('user.no_match', language)}
          actionColumn={{
            label: t('label.actions', language),
            render: (u) => (
              <div className="flex items-center gap-2">
                {/* Edit */}
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  aria-label={`${t('action.edit', language)} ${u.name}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {/* Deactivate / Activate — hidden for self */}
                {u.id !== me?.id && (
                  u.is_active ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deactivateMutation.mutate(u.id);
                      }}
                      disabled={deactivateMutation.isPending}
                      className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
                      aria-label={`${t('user.deactivate', language)} ${u.name}`}
                      title={t('user.deactivate', language)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        activateMutation.mutate(u.id);
                      }}
                      disabled={activateMutation.isPending}
                      className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors disabled:opacity-50"
                      aria-label={`${t('user.activate', language)} ${u.name}`}
                      title={t('user.activate', language)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )
                )}
                {/* Delete — hidden for self */}
                {u.id !== me?.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(u.id); }}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label={`${t('action.delete', language)} ${u.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ),
          }}
        />
      )}

      {/* ── Create User Modal ──────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('user.create_title', language)}>
        <div className="space-y-4">
          {createError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}
          <div>
            <label htmlFor="create-name" className={LABEL_CLASS}>{t('label.name', language)} *</label>
            <input
              id="create-name"
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t('user.full_name_placeholder', language)}
              required
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="create-email" className={LABEL_CLASS}>{t('label.email', language)} *</label>
            <input
              id="create-email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              placeholder={t('user.email_placeholder', language)}
              required
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="create-password" className={LABEL_CLASS}>{t('label.password', language)} *</label>
            <input
              id="create-password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              placeholder={t('user.pw_placeholder', language)}
              required
              minLength={6}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="create-role" className={LABEL_CLASS}>{t('label.role', language)} *</label>
            <select
              id="create-role"
              value={createForm.role}
              onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as UserRole }))}
              className={INPUT_CLASS}
            >
              <option value="technician">{t('role.technician', language)}</option>
              <option value="manager">{t('role.manager', language)}</option>
              <option value="admin">{t('role.admin', language)}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('action.cancel', language)}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {createMutation.isPending ? t('user.creating', language) : t('action.create_user', language)}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      <Modal
        open={editUser !== null && !showResetModal}
        onClose={() => setEditUser(null)}
        title={`${t('user.edit_title', language)} — ${editUser?.name ?? ''}`}
      >
        <div className="space-y-4">
          {editError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}
          <div>
            <label htmlFor="edit-name" className={LABEL_CLASS}>{t('label.name', language)} *</label>
            <input
              id="edit-name"
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t('user.full_name_placeholder', language)}
              required
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="edit-email" className={LABEL_CLASS}>{t('label.email', language)} *</label>
            <input
              id="edit-email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              placeholder={t('user.email_placeholder', language)}
              required
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="edit-role" className={LABEL_CLASS}>{t('label.role', language)} *</label>
            <select
              id="edit-role"
              value={editForm.role}
              onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as UserRole }))}
              className={INPUT_CLASS}
            >
              <option value="technician">{t('role.technician', language)}</option>
              <option value="manager">{t('role.manager', language)}</option>
              <option value="admin">{t('role.admin', language)}</option>
            </select>
          </div>

          {/* Reset Password button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={openResetPassword}
              className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline transition-colors"
            >
              {t('user.reset_password', language)}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditUser(null)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('action.cancel', language)}
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {updateMutation.isPending ? t('action.saving', language) : t('action.save_changes', language)}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Reset Password Modal ───────────────────────────────────────────── */}
      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={`${t('user.reset_pw_title', language)} — ${editUser?.name ?? ''}`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          {resetError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {resetError}
            </p>
          )}
          <div>
            <label htmlFor="reset-password" className={LABEL_CLASS}>{t('user.new_pw_label', language)}</label>
            <input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('user.pw_placeholder', language)}
              minLength={6}
              className={INPUT_CLASS}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('action.cancel', language)}
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetMutation.isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {resetMutation.isPending ? t('user.resetting', language) : t('user.reset_password', language)}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('user.delete_title', language)}
        message={t('user.delete_message', language)}
        confirmLabel={t('action.delete', language)}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
