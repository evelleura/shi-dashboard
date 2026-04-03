import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectMaterials, createMaterial, updateMaterial, deleteMaterial } from '../services/api';
import type { CreateMaterialData } from '../types';
import { PROJECT_KEYS } from './useProjects';

export const MATERIAL_KEYS = {
  byProject: (projectId: number) => ['materials', projectId] as const,
};

export function useProjectMaterials(projectId: number) {
  return useQuery({
    queryKey: MATERIAL_KEYS.byProject(projectId),
    queryFn: () => getProjectMaterials(projectId),
    staleTime: 1000 * 60 * 2,
    enabled: projectId > 0,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterialData) => createMaterial(data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: MATERIAL_KEYS.byProject(variables.project_id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(variables.project_id) });
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMaterialData>; projectId: number }) =>
      updateMaterial(id, data),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: MATERIAL_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; projectId: number }) => deleteMaterial(id),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: MATERIAL_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
  });
}
