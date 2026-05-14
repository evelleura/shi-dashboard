import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { ApiResponse } from '../types';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: number | null;
  project_id: number | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsData {
  notifications: AppNotification[];
  unread: number;
}

export const NOTIF_KEY = ['notifications'] as const;

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<NotificationsData>>('/notifications');
      return res.data.data!;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIF_KEY });
      const prev = qc.getQueryData<NotificationsData>(NOTIF_KEY);
      if (prev) {
        qc.setQueryData<NotificationsData>(NOTIF_KEY, {
          notifications: prev.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
          unread: Math.max(0, prev.unread - 1),
        });
      }
      return prev;
    },
    onError: (_e, _id, prev) => { if (prev) qc.setQueryData(NOTIF_KEY, prev); },
    onSettled: () => void qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: NOTIF_KEY });
      const prev = qc.getQueryData<NotificationsData>(NOTIF_KEY);
      if (prev) {
        qc.setQueryData<NotificationsData>(NOTIF_KEY, {
          notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
          unread: 0,
        });
      }
      return prev;
    },
    onError: (_e, _v, prev) => { if (prev) qc.setQueryData(NOTIF_KEY, prev); },
    onSettled: () => void qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}
