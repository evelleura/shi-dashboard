'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '../services/api';
import type { AuditLogEntry } from '../types';

const LIMIT = 50;

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function actionBadge(action: string) {
  const map: Record<string, string> = {
    create: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    status_change: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };
  const cls = map[action] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>
      {action.replace('_', ' ')}
    </span>
  );
}

const ENTITY_TYPES = ['All', 'project', 'task', 'client', 'user'];

export default function AuditLogPage() {
  const [filter, setFilter] = useState('');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (replace: boolean) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const offset = replace ? 0 : logs.length;
      const result = await getAuditLogs({
        entity_type: filter || undefined,
        limit: LIMIT,
        offset,
      });
      setLogs((prev) => replace ? result.logs : [...prev, ...result.logs]);
      setTotal(result.total);
    } catch {
      setError('Failed to load audit logs. The audit API may not be enabled yet.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    void fetchLogs(true);
  }, [fetchLogs]);

  const hasMore = logs.length < total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Recent changes across projects, tasks, and clients
          </p>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          disabled={loading}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          aria-label="Refresh audit log"
        >
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by entity type">
        {ENTITY_TYPES.map((type) => {
          const active = (type === 'All' ? '' : type) === filter;
          return (
            <button
              key={type}
              onClick={() => setFilter(type === 'All' ? '' : type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              aria-pressed={active}
            >
              {type === 'All' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity found.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {/* Table header */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Audit log entries">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Field</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Old Value</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="text-xs text-gray-500 dark:text-gray-400"
                        title={new Date(log.created_at).toLocaleString('id-ID')}
                      >
                        {relativeTime(log.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {log.changed_by_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {actionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{log.entity_type}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate max-w-[160px]">
                          {log.entity_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.field_name ? (
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                          {log.field_name}
                        </code>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[140px]">
                      {log.old_value != null ? (
                        <span className="text-xs text-red-600 dark:text-red-400 truncate block" title={log.old_value}>
                          {log.old_value}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[140px]">
                      {log.new_value != null ? (
                        <span className="text-xs text-green-600 dark:text-green-400 truncate block" title={log.new_value}>
                          {log.new_value}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer: count + load more */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Showing {logs.length} of {total} entries
            </span>
            {hasMore && (
              <button
                onClick={() => fetchLogs(false)}
                disabled={loadingMore}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1.5"
              >
                {loadingMore && (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
