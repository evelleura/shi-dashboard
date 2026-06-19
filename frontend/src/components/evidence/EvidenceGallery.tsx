import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getTaskEvidence, downloadEvidenceBlob, deleteEvidence } from '../../services/api';
import type { TaskEvidence } from '../../types';

interface Props {
  taskId: number;
  canDelete?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isImageFile(ev: TaskEvidence): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(ev.file_name);
}

const TYPE_ICONS: Record<string, string> = {
  photo: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  form: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  screenshot: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
  other: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
};

function EvidenceItem({ ev, canDelete, onDelete, deleting }: {
  ev: TaskEvidence;
  canDelete: boolean;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const isImage = isImageFile(ev);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbError, setThumbError] = useState(false);
  const [opening, setOpening] = useState(false);

  // Eagerly fetch image blobs (auth header attached) so the thumbnail renders
  // inline. Non-images skip this and only fetch on click.
  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    let url: string | null = null;
    downloadEvidenceBlob(ev.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setThumbUrl(url);
      })
      .catch(() => { if (!cancelled) setThumbError(true); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [ev.id, isImage]);

  // Open in a new tab via blob (works for both images, which display inline,
  // and documents). Reuses the already-fetched thumbnail blob for images.
  const handleOpen = async () => {
    if (thumbUrl) { window.open(thumbUrl, '_blank', 'noopener'); return; }
    setOpening(true);
    try {
      const blob = await downloadEvidenceBlob(ev.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // 401/404 handled by axios interceptor / silent fail
    } finally {
      setOpening(false);
    }
  };

  const iconPath = TYPE_ICONS[ev.file_type] ?? TYPE_ICONS.other;

  return (
    <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <button
        type="button"
        onClick={handleOpen}
        className="w-12 h-12 rounded-lg overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-blue-400 transition"
        aria-label={`Buka ${ev.file_name}`}
      >
        {isImage && thumbUrl && !thumbError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={ev.file_name} className="w-full h-full object-cover" />
        ) : isImage && !thumbError ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        ) : (
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={handleOpen}
          disabled={opening}
          className="text-sm font-medium text-blue-600 hover:underline truncate block text-left disabled:opacity-60"
        >
          {ev.file_name}
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatFileSize(ev.file_size)} -- {ev.file_type} -- {ev.uploaded_by_name ?? 'Tidak diketahui'}
        </p>
        {ev.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ev.description}</p>
        )}
        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">
          {ev.uploaded_at ? formatDate(ev.uploaded_at) : ''}
        </p>
      </div>
      {canDelete && (
        <button
          onClick={() => onDelete(ev.id)}
          disabled={deleting}
          className="text-red-400 hover:text-red-600 transition-colors shrink-0 disabled:opacity-50"
          aria-label={`Hapus ${ev.file_name}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function EvidenceGallery({ taskId, canDelete = false }: Props) {
  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ['evidence', taskId],
    queryFn: () => getTaskEvidence(taskId),
    staleTime: 1000 * 30,
    enabled: taskId > 0,
  });

  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteEvidence,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['evidence', taskId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Belum ada file bukti yang diunggah</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {evidence.map((ev: TaskEvidence) => (
        <EvidenceItem
          key={ev.id}
          ev={ev}
          canDelete={canDelete}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleting={deleteMutation.isPending && deleteMutation.variables === ev.id}
        />
      ))}
    </div>
  );
}
