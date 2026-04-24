import type { HealthStatus } from '../../types';

interface Props {
  status: HealthStatus | null;
  showLabel?: boolean;
}

const config: Record<HealthStatus, { bg: string; text: string; label: string; dot: string }> = {
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', label: 'On Track', dot: 'bg-green-500' },
  amber: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', label: 'Warning', dot: 'bg-yellow-500' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', label: 'Critical', dot: 'bg-red-500' },
};

export default function StatusBadge({ status, showLabel = true }: Props) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        {showLabel && 'No Report'}
      </span>
    );
  }

  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {showLabel && c.label}
    </span>
  );
}
