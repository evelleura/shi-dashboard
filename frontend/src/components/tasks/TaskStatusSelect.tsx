import type { TaskStatus, UserRole } from '../../types';

interface Props {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  userRole?: UserRole;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string; ring: string }> = {
  to_do: { label: 'To Do', bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-300' },
  working_on_it: { label: 'Working On It', bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-300' },
  done: { label: 'Done', bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-300' },
};

export function getStatusConfig(status: TaskStatus) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.to_do;
}

export function TaskStatusBadge({ status, size = 'sm' }: { status: TaskStatus; size?: 'sm' | 'md' }) {
  const config = getStatusConfig(status);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-block rounded-full font-medium ${config.bg} ${config.text} ${sizeClass}`}>
      {config.label}
    </span>
  );
}

function getAvailableStatuses(userRole?: UserRole): TaskStatus[] {
  if (userRole === 'technician') {
    return ['to_do', 'working_on_it'];
  }
  return ['to_do', 'working_on_it', 'done'];
}

export default function TaskStatusSelect({ value, onChange, disabled = false, size = 'sm', userRole }: Props) {
  const config = getStatusConfig(value);
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  const availableStatuses = getAvailableStatuses(userRole);

  // If current value is 'done' and technician can't change it, show as disabled badge
  const isTechViewingDone = userRole === 'technician' && value === 'done';

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      disabled={disabled || isTechViewingDone}
      className={`rounded-full font-medium border-0 ring-1 ${config.ring} ${config.bg} ${config.text} ${sizeClass} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-6`}
      aria-label="Change task status"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 4px center',
        backgroundSize: '14px',
      }}
    >
      {availableStatuses.map((s) => (
        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
      ))}
      {/* If current value is done but not in available list, show it as an option so select renders correctly */}
      {value === 'done' && !availableStatuses.includes('done') && (
        <option value="done">{STATUS_CONFIG.done.label}</option>
      )}
    </select>
  );
}
