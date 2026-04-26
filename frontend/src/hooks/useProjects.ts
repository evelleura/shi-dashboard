import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignTechnician,
  unassignTechnician,
  approveSurvey,
  rejectSurvey,
  getMyProjects,
} from '../services/api';
import type { CreateProjectData, UpdateProjectData } from '../types';

export const PROJECT_KEYS = {
  all: ['projects'] as const,
  detail: (id: number) => ['projects', id] as const,
  myProjects: ['my-projects'] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: PROJECT_KEYS.all,
    queryFn: getProjects,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: () => getProject(id),
    staleTime: 1000 * 60,
    enabled: id > 0,
  });
}

export function useMyProjects() {
  return useQuery({
    queryKey: PROJECT_KEYS.myProjects,
    queryFn: getMyProjects,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectData) => createProject(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectData }) => updateProject(id, data),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAssignTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      assignTechnician(projectId, userId),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
  });
}

export function useUnassignTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      unassignTechnician(projectId, userId),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
  });
}

export function useApproveSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => approveSurvey(projectId),
    onSuccess: (_data, projectId) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}

export function useRejectSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => rejectSurvey(id, reason),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}
