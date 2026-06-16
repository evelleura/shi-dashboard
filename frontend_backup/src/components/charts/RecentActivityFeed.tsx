'use client';

import { useRecentActivityFeed } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';
import type { DateRange } from '../../types';

interface Props {
  dateRange?: DateRange;
}

type ActivityColor = 'green' | 'blue' | 'red' | 'gray';

const ACTIVITY_TYPE_CONFIG_ID: Record<string, { color: ActivityColor; label: string }> = {
  completed:    { color: 'green', label: 'Selesai' },
  done:         { color: 'green', label: 'Selesai' },
  updated:      { color: 'blue',  label: 'Diperbarui' },
  in_progress:  { color: 'blue',  label: 'Dikerjakan' },
  working_on_it:{ color: 'blue',  label: 'Sedang Dikerjakan' },
  escalation:   { color: 'red',   label: 'Eskalasi' },
  report:       { color: 'gray',  label: 'Laporan' },
};

const ACTIVITY_TYPE_CONFIG_EN: Record<string, { color: ActivityColor; label: string }> = {
  completed:    { color: 'green', label: 'Completed' },
  done:         { color: 'green', label: 'Done' },
  updated:      { color: 'blue',  label: 'Updated' },
  in_progress:  { color: 'blue',  label: 'In Progress' },
  working_on_it:{ color: 'blue',  label: 'Working' },
  escalation:   { color: 'red',   label: 'Escalation' },
  report:       { color: 'gray',  label: 'Report' },
};

const DOT_COLORS: Record<ActivityColor, string> = {
  green: 'bg-green-500',
  blue:  'bg-blue-500',
  red:   'bg-red-500',
  gray:  'bg-gray-400',
};

function relativeTimeId(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  if (isNaN(diff) || diff < 0) return 'baru saja';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function relativeTimeEn(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  if (isNaN(diff) || diff < 0) return 'just now';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function CardWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function RecentActivityFeed({ dateRange }: Props) {
  const { data: rawData, isLoading } = useRecentActivityFeed(dateRange);
  const { language } = useLanguage();
  const id = language === 'id';
  const title = id ? 'Aktivitas Terbaru' : 'Recent Activity';
  const ACTIVITY_TYPE_CONFIG = id ? ACTIVITY_TYPE_CONFIG_ID : ACTIVITY_TYPE_CONFIG_EN;
  const relativeTime = id ? relativeTimeId : relativeTimeEn;

  function getActivityConfig(type: string): { color: ActivityColor; label: string } {
    return ACTIVITY_TYPE_CONFIG[type.toLowerCase()] ?? { color: 'gray', label: type };
  }

  if (isLoading) {
    return (
      <CardWrapper title={title}>
        <div className="flex items-center justify-center h-56">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-label="Loading activity..." />
        </div>
      </CardWrapper>
    );
  }

  const items = (rawData ?? []).slice(0, 20);

  if (items.length === 0) {
    return (
      <CardWrapper title={title}>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          {id ? 'Belum ada aktivitas terbaru' : 'No recent activity'}
        </p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title={title}>
      <ol className="max-h-80 overflow-y-auto space-y-0 pr-1" aria-label={id ? 'Feed aktivitas' : 'Activity feed'}>
        {items.map((item, idx) => {
          const { color } = getActivityConfig(item.type);
          return (
            <li key={idx} className="flex gap-3 pb-3 last:pb-0">
              <div className="flex flex-col items-center">
                <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLORS[color]}`} aria-hidden="true" />
                {idx < items.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" aria-hidden="true" />
                )}
              </div>
              <div className="pb-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.item_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.project_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.user_name}</span>
                  <span className="text-gray-300 dark:text-gray-600 text-xs" aria-hidden="true">·</span>
                  <time className="text-xs text-gray-400 dark:text-gray-500" dateTime={item.activity_at}>
                    {relativeTime(item.activity_at)}
                  </time>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </CardWrapper>
  );
}
