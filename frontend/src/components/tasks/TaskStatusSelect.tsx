import type { TaskStatus, UserRole } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { t, type TranslationKey } from '../../lib/i18n';

interface Props {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  userRole?: UserRole;
}

// Warna per status. Label diambil dari i18n (t) supaya full Bahasa Indonesia.
const STATUS_CONFIG: Record<TaskStatus, { bg: string; text: string; ring: string }> = {
  to_do: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', ring: 'ring-gray-300 dark:ring-gray-600' },
  in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-300 dark:ring-blue-700' },
  working_on_it: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', ring: 'ring-green-300 dark:ring-green-700' },
  review: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-300 dark:ring-purple-700' },
  done: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-300 dark:ring-emerald-700' },
};

export function getStatusConfig(status: TaskStatus) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.to_do;
}

function statusLabel(status: TaskStatus, language: 'id' | 'en'): string {
  return t(`status.${status}` as TranslationKey, language);
}

export function TaskStatusBadge({ status, size = 'sm' }: { status: TaskStatus; size?: 'sm' | 'md' }) {
  const { language } = useLanguage();
  const config = getStatusConfig(status);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const label = statusLabel(status, language);

  // working_on_it gets a pulsing dot indicator
  if (status === 'working_on_it') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClass}`}>
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-block rounded-full font-medium ${config.bg} ${config.text} ${sizeClass}`}>
      {label}
    </span>
  );
}

/**
 * Status yang tersedia di dropdown berdasarkan peran (naskah 3-status).
 * - Teknisi: to_do, working_on_it (gate review: TIDAK bisa 'done').
 * - Manajer: to_do, working_on_it, done.
 */
function getAvailableStatuses(userRole?: UserRole): TaskStatus[] {
  if (userRole === 'teknisi') {
    return ['to_do', 'working_on_it'];
  }
  return ['to_do', 'working_on_it', 'done'];
}

export default function TaskStatusSelect({ value, onChange, disabled = false, size = 'sm', userRole }: Props) {
  const { language } = useLanguage();
  const config = getStatusConfig(value);
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  const availableStatuses = getAvailableStatuses(userRole);

  // If current value is not in available list (e.g., technician viewing 'done'), show as disabled
  const isReadOnly = !availableStatuses.includes(value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      disabled={disabled || isReadOnly}
      className={`rounded-lg font-medium border-0 ring-1 ${config.ring} ${config.bg} ${config.text} ${sizeClass} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-6 w-full max-w-[140px]`}
      aria-label="Change task status"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 4px center',
        backgroundSize: '14px',
      }}
    >
      {availableStatuses.map((s) => (
        <option key={s} value={s}>{statusLabel(s, language)}</option>
      ))}
      {/* If current value is not in available list, still render it so select displays correctly */}
      {!availableStatuses.includes(value) && (
        <option value={value}>{statusLabel(value, language)}</option>
      )}
    </select>
  );
}
