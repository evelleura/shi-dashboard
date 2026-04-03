import { useQuery } from '@tanstack/react-query';
import { getTaskEvidence, getEvidenceDownloadUrl, deleteEvidence } from '../../services/api';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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

const TYPE_ICONS: Record<string, string> = {
  photo: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  form: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  screenshot: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
  other: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
};

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
      <p className="text-sm text-gray-400 text-center py-4">No evidence files uploaded</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {evidence.map((ev: TaskEvidence) => {
        const iconPath = TYPE_ICONS[ev.file_type] ?? TYPE_ICONS.other;
        return (
          <div key={ev.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={getEvidenceDownloadUrl(ev.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline truncate block"
              >
                {ev.file_name}
              </a>
              <p className="text-xs text-gray-400">
                {formatFileSize(ev.file_size)} -- {ev.file_type} -- {ev.uploaded_by_name ?? 'Unknown'}
              </p>
              {ev.description && (
                <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>
              )}
              <p className="text-[10px] text-gray-300 mt-0.5">
                {ev.uploaded_at ? formatDate(ev.uploaded_at) : ''}
              </p>
            </div>
            {canDelete && (
              <button
                onClick={() => deleteMutation.mutate(ev.id)}
                className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                aria-label={`Delete ${ev.file_name}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
