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
  getProjectTechnicians,
  type ProjectTechnicianMetrics,
} from '../services/api';
import { useToast } from './useToast';
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
  const toast = useToast();
  return useMutation({
    mutationFn: (data: CreateProjectData) => createProject(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Proyek baru berhasil dibuat');
    },
    onError: () => { toast('Gagal membuat proyek', 'error'); },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectData }) => updateProject(id, data),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Proyek berhasil diperbarui');
    },
    onError: () => { toast('Gagal memperbarui proyek', 'error'); },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Proyek berhasil dihapus');
    },
    onError: () => { toast('Gagal menghapus proyek', 'error'); },
  });
}

export function useAssignTechnician() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      assignTechnician(projectId, userId),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      toast('Teknisi berhasil ditugaskan');
    },
    onError: () => { toast('Gagal menugaskan teknisi', 'error'); },
  });
}

export function useUnassignTechnician() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      unassignTechnician(projectId, userId),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      toast('Teknisi berhasil dicopot');
    },
    onError: () => { toast('Gagal mencopot teknisi', 'error'); },
  });
}

export function useApproveSurvey() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (projectId: number) => approveSurvey(projectId),
    onSuccess: (_data, projectId) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast('Survei disetujui, proyek masuk fase eksekusi');
    },
    onError: () => { toast('Gagal menyetujui survei', 'error'); },
  });
}

export function useProjectTechnicians(projectId: number) {
  return useQuery<ProjectTechnicianMetrics[]>({
    queryKey: ['project-technicians', projectId] as const,
    queryFn: () => getProjectTechnicians(projectId),
    staleTime: 1000 * 30,
    enabled: projectId > 0,
  });
}

export function useRejectSurvey() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => rejectSurvey(id, reason),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast('Survei ditolak');
    },
    onError: () => { toast('Gagal menolak survei', 'error'); },
  });
}
