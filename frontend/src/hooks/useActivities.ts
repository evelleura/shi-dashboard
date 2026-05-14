import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskActivities, createActivity } from '../services/api';

export const ACTIVITY_KEYS = {
  byTask: (taskId: number) => ['activities', taskId] as const,
};

export function useTaskActivities(taskId: number) {
  return useQuery({
    queryKey: ACTIVITY_KEYS.byTask(taskId),
    queryFn: () => getTaskActivities(taskId),
    staleTime: 1000 * 15,
    enabled: taskId > 0,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => createActivity(data),
    onSuccess: (_data, variables) => {
      const taskId = Number(variables.get('task_id'));
      if (taskId > 0) {
        void qc.invalidateQueries({ queryKey: ACTIVITY_KEYS.byTask(taskId) });
      }
      void qc.invalidateQueries({ queryKey: ['tasks'] });
      void qc.invalidateQueries({ queryKey: ['technician-dashboard'] });
    },
  });
}
