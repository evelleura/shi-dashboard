import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEscalations,
  getEscalationSummary,
  createEscalation,
  reviewEscalation,
  resolveEscalation,
} from '../services/api';

export const ESCALATION_KEYS = {
  all: ['escalations'] as const,
  list: (params?: { status?: string; project_id?: number }) => ['escalations', 'list', params] as const,
  summary: ['escalations', 'summary'] as const,
};

export function useEscalations(params?: { status?: string; project_id?: number }) {
  return useQuery({
    queryKey: ESCALATION_KEYS.list(params),
    queryFn: () => getEscalations(params),
    staleTime: 1000 * 30,
  });
}

export function useEscalationSummary() {
  return useQuery({
    queryKey: ESCALATION_KEYS.summary,
    queryFn: getEscalationSummary,
    staleTime: 1000 * 30,
  });
}

export function useCreateEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => createEscalation(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ESCALATION_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['technician-dashboard'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useReviewEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewEscalation(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ESCALATION_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useResolveEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution_notes }: { id: number; resolution_notes: string }) =>
      resolveEscalation(id, resolution_notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ESCALATION_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      void qc.invalidateQueries({ queryKey: ['technician-dashboard'] });
    },
  });
}
