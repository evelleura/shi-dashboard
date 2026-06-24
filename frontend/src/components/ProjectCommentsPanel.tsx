'use client';

import { useState, type FormEvent } from 'react';
import { useProjectComments, useAddProjectComment, useUpdateProjectComment, useDeleteProjectComment } from '../hooks/useProjectComments';
import { useAuth } from '../hooks/useAuth';
import ConfirmDialog from './ui/ConfirmDialog';

interface ProjectCommentsPanelProps {
  projectId: number;
}

function formatTime(d: string): string {
  try {
    return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return d;
  }
}

/**
 * Komentar Proyek - utas komunikasi tim per proyek. Manajer/admin & teknisi yang
 * ditugaskan boleh membaca dan menulis (gerbang akses ada di handler). Edit hanya
 * oleh penulis; hapus oleh penulis atau manajer/admin.
 */
export default function ProjectCommentsPanel({ projectId }: ProjectCommentsPanelProps) {
  const { user } = useAuth();
  const canManage = user?.role === 'manajer' || user?.role === 'admin';
  const { data: comments = [], isLoading } = useProjectComments(projectId);
  const addComment = useAddProjectComment(projectId);
  const updateComment = useUpdateProjectComment(projectId);
  const deleteComment = useDeleteProjectComment(projectId);

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync(trimmed);
      setText('');
    } catch {
      setError('Gagal mengirim komentar. Coba lagi.');
    }
  };

  const handleSaveEdit = async (id: number) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    await updateComment.mutateAsync({ id, message: trimmed });
    setEditId(null);
    setEditText('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Komentar Proyek</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Diskusikan proyek ini bersama tim. Hanya anggota proyek dan manajer yang dapat melihat utas ini.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Tulis komentar..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {addComment.isPending ? 'Mengirim...' : 'Kirim'}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-gray-400">Memuat...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada komentar.</p>
        ) : (
          comments.map((c) => {
            const isOwn = c.author_id === user?.id;
            const isEditing = editId === c.id;
            return (
              <div key={c.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold shrink-0">
                    {(c.author_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{c.author_name ?? 'Pengguna'}</span>
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(c.created_at)}</span>
                        {c.is_edited && <span className="text-xs text-gray-400 shrink-0">(diedit)</span>}
                      </div>
                      {(isOwn || canManage) && !isEditing && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isOwn && (
                            <button
                              type="button"
                              onClick={() => { setEditId(c.id); setEditText(c.message); }}
                              title="Ubah komentar"
                              aria-label="Ubah komentar"
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteId(c.id)}
                            title="Hapus komentar"
                            aria-label="Hapus komentar"
                            className="text-red-500 hover:text-red-600 disabled:opacity-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="mt-1.5 space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditId(null); setEditText(''); }}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={!editText.trim() || updateComment.isPending}
                            onClick={() => handleSaveEdit(c.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updateComment.isPending ? 'Menyimpan...' : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.message}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          await deleteComment.mutateAsync(deleteId!);
          setDeleteId(null);
        }}
        title="Hapus Komentar"
        message="Hapus komentar ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteComment.isPending}
      />
    </div>
  );
}
