import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboard, getProjects, getProject, createProject, updateProject, submitReport, getReports, getTechnicians, getMyProjects, assignTechnician } from '../services/api';

export const QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  projects: ['projects'] as const,
  project: (id: number) => ['projects', id] as const,
  reports: (params?: object) => ['reports', params] as const,
  myProjects: ['my-projects'] as const,
  technicians: ['technicians'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: getDashboard,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // background refetch every 5 minutes
  });
}

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: getProjects,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.project(id),
    queryFn: () => getProject(id),
    staleTime: 1000 * 60,
  });
}

export function useMyProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.myProjects,
    queryFn: getMyProjects,
    staleTime: 1000 * 60 * 2,
  });
}

export function useTechnicians() {
  return useQuery({
    queryKey: QUERY_KEYS.technicians,
    queryFn: getTechnicians,
    staleTime: 1000 * 60 * 5,
  });
}

export function useReports(params?: { project_id?: number; from?: string; to?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.reports(params),
    queryFn: () => getReports(params),
    staleTime: 1000 * 60,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateProject>[1] }) =>
      updateProject(id, data),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.project(id) });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitReport,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.project(variables.project_id) });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.reports() });
    },
  });
}

export function useAssignTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      assignTechnician(projectId, userId),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
    },
  });
}
