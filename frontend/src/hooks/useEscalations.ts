import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEscalations,
  getEscalationSummary,
  createEscalation,
  reviewEscalation,
  resolveEscalation,
  getEscalationUpdates,
  addEscalationUpdate,
  requestEscalationAction,
  respondEscalationAction,
} from '../services/api';
import type { EscalationActionRequest } from '../types';

export const ESCALATION_KEYS = {
  all: ['escalations'] as const,
  list: (params?: { status?: string; project_id?: number }) => ['escalations', 'list', params] as const,
  summary: ['escalations', 'summary'] as const,
  updates: (id: number) => ['escalations', 'updates', id] as const,
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

export function useEscalationUpdates(id: number) {
  return useQuery({
    queryKey: ESCALATION_KEYS.updates(id),
    queryFn: () => getEscalationUpdates(id),
    staleTime: 1000 * 15,
    enabled: id > 0,
  });
}

export function useAddEscalationUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) => addEscalationUpdate(id, message),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ESCALATION_KEYS.updates(variables.id) });
    },
  });
}


export function useRequestEscalationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action_request, action_request_note }: {
      id: number;
      action_request: EscalationActionRequest;
      action_request_note: string;
    }) => requestEscalationAction(id, action_request, action_request_note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ESCALATION_KEYS.all });
    },
  });
}

export function useRespondEscalationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, response_note }: {
      id: number;
      status: 'approved' | 'rejected';
      response_note: string;
    }) => respondEscalationAction(id, status, response_note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ESCALATION_KEYS.all });
    },
  });
}
