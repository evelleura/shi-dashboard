import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDailyReports, createDailyReport, deleteDailyReport } from '../services/api';
import type { CreateDailyReportData } from '../types';

export const DAILY_REPORT_KEYS = {
  byProject: (projectId: number) => ['daily-reports', projectId] as const,
};

export function useDailyReports(projectId: number) {
  return useQuery({
    queryKey: DAILY_REPORT_KEYS.byProject(projectId),
    queryFn: () => getDailyReports(projectId),
    enabled: projectId > 0,
    staleTime: 1000 * 15,
  });
}

export function useCreateDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDailyReportData) => createDailyReport(data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: DAILY_REPORT_KEYS.byProject(variables.project_id) });
    },
  });
}

export function useDeleteDailyReport(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDailyReport(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DAILY_REPORT_KEYS.byProject(projectId) });
    },
  });
}
