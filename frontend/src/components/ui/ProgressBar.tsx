interface Props {
  actual: number;
  planned: number;
  showLabels?: boolean;
}

export default function ProgressBar({ actual, planned, showLabels = true }: Props) {
  const clampedActual = Math.min(100, Math.max(0, actual));
  const clampedPlanned = Math.min(100, Math.max(0, planned));

  const actualColor =
    clampedActual >= clampedPlanned * 0.95
      ? 'bg-green-500'
      : clampedActual >= clampedPlanned * 0.85
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Progress</span>
          <span>{clampedActual.toFixed(1)}% / {clampedPlanned.toFixed(1)}%</span>
        </div>
      )}
      <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Planned (baseline indicator) */}
        <div
          className="absolute top-0 left-0 h-full bg-gray-300 dark:bg-gray-600 rounded-full"
          style={{ width: `${clampedPlanned}%` }}
        />
        {/* Actual */}
        <div
          className={`absolute top-0 left-0 h-full ${actualColor} rounded-full transition-all duration-500`}
          style={{ width: `${clampedActual}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs">
          <span className={actualColor.replace('bg-', 'text-')}>Actual: {clampedActual.toFixed(1)}%</span>
          <span className="text-gray-400 dark:text-gray-500">Plan: {clampedPlanned.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
