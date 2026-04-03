import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectBudget, createBudgetItem, updateBudgetItem, deleteBudgetItem } from '../services/api';
import type { CreateBudgetItemData } from '../types';
import { PROJECT_KEYS } from './useProjects';

export const BUDGET_KEYS = {
  byProject: (projectId: number) => ['budget', projectId] as const,
};

export function useProjectBudget(projectId: number) {
  return useQuery({
    queryKey: BUDGET_KEYS.byProject(projectId),
    queryFn: () => getProjectBudget(projectId),
    staleTime: 1000 * 60 * 2,
    enabled: projectId > 0,
  });
}

export function useCreateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetItemData) => createBudgetItem(data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: BUDGET_KEYS.byProject(variables.project_id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(variables.project_id) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateBudgetItemData>; projectId: number }) =>
      updateBudgetItem(id, data),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: BUDGET_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; projectId: number }) => deleteBudgetItem(id),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: BUDGET_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
  });
}
