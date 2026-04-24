import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../../types';

interface Props {
  task: Task;
  onStart: () => void;
  onStop: () => void;
  isLoading?: boolean;
}

export function formatTimeSpent(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getElapsedSeconds(task: Task): number {
  const base = Number(task.time_spent_seconds) || 0;
  if (!task.is_tracking || !task.timer_started_at) return base;
  const started = new Date(task.timer_started_at).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - started) / 1000));
  return base + diff;
}

export default function TaskTimer({ task, onStart, onStop, isLoading }: Props) {
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(task));

  useEffect(() => {
    setElapsed(getElapsedSeconds(task));
    if (!task.is_tracking) return;

    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(task));
    }, 1000);

    return () => clearInterval(interval);
  }, [task.is_tracking, task.timer_started_at, task.time_spent_seconds]);

  const handleClick = useCallback(() => {
    if (isLoading) return;
    if (task.is_tracking) {
      onStop();
    } else {
      onStart();
    }
  }, [isLoading, task.is_tracking, onStart, onStop]);

  const estimatedSeconds = (task.estimated_hours ?? 0) * 3600;
  const progressPercent = estimatedSeconds > 0 ? Math.min((elapsed / estimatedSeconds) * 100, 100) : 0;
  const progressColor = estimatedSeconds <= 0
    ? 'bg-blue-500'
    : progressPercent >= 100
      ? 'bg-red-500'
      : progressPercent >= 80
        ? 'bg-amber-500'
        : 'bg-green-500';

  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
      {/* Play/Pause button */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          task.is_tracking
            ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            : 'bg-green-100 hover:bg-green-200 text-green-700'
        } disabled:opacity-50`}
        aria-label={task.is_tracking ? 'Stop timer' : 'Start timer'}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
        ) : task.is_tracking ? (
          /* Pause icon */
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          /* Play icon */
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Pulsing green dot when tracking */}
          {task.is_tracking && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          )}
          <span className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">
            {formatTimeSpent(elapsed)}
          </span>
          {task.is_tracking && (
            <span className="text-xs text-green-600 font-medium">Tracking</span>
          )}
        </div>

        {/* Estimated hours comparison bar */}
        {estimatedSeconds > 0 && (
          <div className="mt-1">
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">
              <span>Est: {task.estimated_hours}h</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div
                className={`${progressColor} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Time progress"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
