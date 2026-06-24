import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjectComments,
  addProjectComment,
  updateProjectComment,
  deleteProjectComment,
} from '../services/api';
import { useToast } from './useToast';

export const PROJECT_COMMENT_KEYS = {
  list: (projectId: number) => ['projects', projectId, 'comments'] as const,
};

export function useProjectComments(projectId: number) {
  return useQuery({
    queryKey: PROJECT_COMMENT_KEYS.list(projectId),
    queryFn: () => getProjectComments(projectId),
    staleTime: 1000 * 15,
    enabled: projectId > 0,
  });
}

export function useAddProjectComment(projectId: number) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (message: string) => addProjectComment(projectId, message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROJECT_COMMENT_KEYS.list(projectId) });
      toast('Komentar terkirim');
    },
    onError: () => { toast('Gagal mengirim komentar', 'error'); },
  });
}

export function useUpdateProjectComment(projectId: number) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) => updateProjectComment(id, message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROJECT_COMMENT_KEYS.list(projectId) });
      toast('Komentar diperbarui');
    },
    onError: () => { toast('Gagal memperbarui komentar', 'error'); },
  });
}

export function useDeleteProjectComment(projectId: number) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => deleteProjectComment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROJECT_COMMENT_KEYS.list(projectId) });
      toast('Komentar dihapus');
    },
    onError: () => { toast('Gagal menghapus komentar', 'error'); },
  });
}
