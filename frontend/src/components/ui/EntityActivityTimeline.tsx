'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';
import type { Language } from '../../hooks/useLanguage';

interface Props {
  entityType: string;
  entityId: number;
  maxInitial?: number;
}

function getActionStyles(language: Language): Record<string, { label: string; cls: string }> {
  return {
    create: { label: t('audit.created', language), cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    update: { label: t('audit.updated', language), cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    delete: { label: t('audit.deleted', language), cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nama',
  address: 'Alamat',
  phone: 'Telepon',
  email: 'Email',
  notes: 'Catatan',
  latitude: 'Latitude',
  longitude: 'Longitude',
  photo: 'Foto',
  status: 'Status',
  phase: 'Fase',
  category: 'Kategori',
  start_date: 'Tanggal Mulai',
  end_date: 'Tanggal Selesai',
  description: 'Deskripsi',
  '*': '',
};

export default function EntityActivityTimeline({ entityType, entityId, maxInitial = 10 }: Props) {
  const { language } = useLanguage();
  const ACTION_STYLES = getActionStyles(language);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', entityType, entityId],
    queryFn: () => getAuditLogs({ entity_type: entityType, entity_id: entityId, limit: 100 }),
    enabled: entityId > 0,
    staleTime: 1000 * 30,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        {t('audit.loading', language)}
      </div>
    );
  }

  const logs = data?.logs ?? [];
  const visible = showAll ? logs : logs.slice(0, maxInitial);

  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 py-2">{t('audit.no_history', language)}</p>;
  }

  return (
    <div>
      <div className="relative space-y-3 pl-5">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
        {visible.map((log) => {
          const action = ACTION_STYLES[log.action] ?? { label: log.action, cls: 'bg-gray-100 text-gray-600' };
          const fieldLabel = log.field_name ? (FIELD_LABELS[log.field_name] ?? log.field_name) : null;
          const showDiff = log.field_name && log.field_name !== '*' && (log.old_value !== null || log.new_value !== null);

          return (
            <div key={log.id} className="relative">
              <div className="absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-blue-400 bg-white dark:bg-gray-900" />
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                <span className={`font-semibold px-1.5 py-0.5 rounded text-xs ${action.cls}`}>
                  {action.label}
                </span>

                {fieldLabel && (
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{fieldLabel}</span>
                )}

                {showDiff && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {log.old_value != null && (
                      <span className="text-red-500 line-through mr-1">{log.old_value}</span>
                    )}
                    {log.new_value != null && (
                      <span className="text-green-600">→ {log.new_value}</span>
                    )}
                  </span>
                )}

                <span className="text-gray-500 dark:text-gray-400">
                  {t('audit.by', language)} <span className="font-medium text-gray-700 dark:text-gray-300">{log.changed_by_name}</span>
                </span>
                <span className="text-gray-400">
                  {new Date(log.created_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {logs.length > maxInitial && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showAll ? t('audit.load_less', language) : `${t('audit.load_more', language)} (${logs.length - maxInitial})`}
        </button>
      )}
    </div>
  );
}
