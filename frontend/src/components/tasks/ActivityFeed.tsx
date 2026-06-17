import { useState, useRef, useEffect } from 'react';
import { useTaskActivities, useCreateActivity } from '../../hooks/useActivities';
import type { TaskActivity, ActivityType } from '../../types';

interface Props {
  taskId: number;
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  arrival: 'bg-blue-500',
  start_work: 'bg-green-500',
  pause: 'bg-amber-500',
  resume: 'bg-green-500',
  note: 'bg-gray-400',
  photo: 'bg-indigo-500',
  complete: 'bg-emerald-600',
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  arrival: 'Arrived',
  start_work: 'Started work',
  pause: 'Paused',
  resume: 'Resumed',
  note: 'Note',
  photo: 'Photo',
  complete: 'Completed',
};

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  arrival: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
  start_work: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
  pause: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
  resume: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
  note: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  photo: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
  complete: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'arrival', label: 'Arrival' },
  { value: 'note', label: 'Note' },
  { value: 'photo', label: 'Photo' },
  { value: 'complete', label: 'Complete' },
];

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function formatActivityTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(dateStr)) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    + ' '
    + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function ActivityItem({ activity }: { activity: TaskActivity }) {
  const color = ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-400';
  const iconPath = ACTIVITY_ICONS[activity.activity_type] || ACTIVITY_ICONS.note;
  const label = ACTIVITY_LABELS[activity.activity_type] || activity.activity_type;
  const initial = (activity.user_name ?? 'U').charAt(0).toUpperCase();

  const isImage = activity.file_type?.startsWith('image/');

  return (
    <div className="flex gap-3 py-2" role="listitem">
      {/* Avatar with activity type color ring */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold flex items-center justify-center">
          {initial}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${color} flex items-center justify-center ring-2 ring-white dark:ring-gray-800`}>
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{activity.user_name ?? 'User'}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white ${color}`}>
            {label}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">{activity.message}</p>

        {/* Photo thumbnail */}
        {activity.file_path && isImage && (
          <a
            href={`/api/activities/${activity.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block"
          >
            <img
              src={`/api/activities/${activity.id}/file`}
              alt={activity.file_name ?? 'Activity photo'}
              className="max-w-[200px] max-h-[150px] rounded-lg border border-gray-200 dark:border-gray-700 object-cover hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </a>
        )}

        {/* Non-image file attachment */}
        {activity.file_path && !isImage && activity.file_name && (
          <a
            href={`/api/activities/${activity.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {activity.file_name}
          </a>
        )}

        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatActivityTime(activity.created_at)}</p>
      </div>
    </div>
  );
}

export default function ActivityFeed({ taskId }: Props) {
  const { data: activities = [], isLoading, isError } = useTaskActivities(taskId);
  const createMutation = useCreateActivity();
  const feedEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('note');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activities.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const formData = new FormData();
    formData.append('task_id', String(taskId));
    formData.append('message', message.trim());
    formData.append('activity_type', activityType);
    if (file) {
      formData.append('file', file);
    }

    await createMutation.mutateAsync(formData);
    setMessage('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-500">Failed to load activity feed. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Activity list */}
      <div
        className="max-h-[300px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 px-1"
        role="list"
        aria-label="Activity feed"
      >
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Post a note or log your arrival</p>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        {/* File preview */}
        {file && (
          <div className="flex items-center gap-2 mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{file.name}</span>
            <button
              type="button"
              onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="text-gray-400 hover:text-red-500 shrink-0"
              aria-label="Remove file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Activity type selector */}
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2 bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
            aria-label="Activity type"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Message input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Activity message"
          />

          {/* File attach */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Attach file"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || createMutation.isPending}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md transition-colors shrink-0"
            aria-label="Send activity"
          >
            {createMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
