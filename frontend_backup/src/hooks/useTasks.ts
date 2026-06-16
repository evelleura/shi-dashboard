import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
  createBulkTasks,
  reorderTask,
} from '../services/api';
import { useToast } from './useToast';
import type { CreateTaskData, UpdateTaskData, TaskStatus, ProjectWithDetail, TechnicianDashboardData } from '../types';
import { PROJECT_KEYS } from './useProjects';

export const TASK_KEYS = {
  byProject: (projectId: number) => ['tasks', 'project', projectId] as const,
  detail: (id: number) => ['tasks', id] as const,
};

export function useProjectTasks(projectId: number) {
  return useQuery({
    queryKey: TASK_KEYS.byProject(projectId),
    queryFn: () => getProjectTasks(projectId),
    staleTime: 1000 * 30,
    enabled: projectId > 0,
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: TASK_KEYS.detail(id),
    queryFn: () => getTask(id),
    staleTime: 1000 * 30,
    enabled: id > 0,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: CreateTaskData) => createTask(data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(variables.project_id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(variables.project_id) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Tugas baru berhasil ditambahkan');
    },
    onError: () => { toast('Gagal menambahkan tugas', 'error'); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskData; projectId: number }) =>
      updateTask(id, data),
    onSuccess: (_data, { id, projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      toast('Tugas berhasil diperbarui');
    },
    onError: () => { toast('Gagal memperbarui tugas', 'error'); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id }: { id: number; projectId: number }) => deleteTask(id),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Tugas berhasil dihapus');
    },
    onError: () => { toast('Gagal menghapus tugas', 'error'); },
  });
}

export function useChangeTaskStatus() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus; projectId: number }) =>
      changeTaskStatus(id, status),
    onMutate: async ({ id, status, projectId }) => {
      await qc.cancelQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      await qc.cancelQueries({ queryKey: ['technician-dashboard'] });

      const previousProject = qc.getQueryData<ProjectWithDetail>(PROJECT_KEYS.detail(projectId));
      if (previousProject) {
        qc.setQueryData<ProjectWithDetail>(PROJECT_KEYS.detail(projectId), {
          ...previousProject,
          tasks: previousProject.tasks.map(t => t.id === id ? { ...t, status } : t),
        });
      }

      // Mirror the optimistic update on the technician dashboard cache so
      // the Kanban card moves immediately in the technician view too.
      const previousTech = qc.getQueryData<TechnicianDashboardData>(['technician-dashboard']);
      if (previousTech) {
        qc.setQueryData<TechnicianDashboardData>(['technician-dashboard'], {
          ...previousTech,
          recent_tasks: previousTech.recent_tasks.map(t => t.id === id ? { ...t, status } : t),
        });
      }

      return { previousProject, previousTech, projectId };
    },
    onSuccess: (_data, { status }) => {
      const labels: Record<string, string> = {
        to_do:         'Tugas dikembalikan ke Belum Mulai',
        in_progress:   'Tugas dipindah ke Sedang Dikerjakan',
        working_on_it: 'Tugas dipindah ke Sedang Dikerjakan',
        review:        'Tugas dikirim ke Review',
        done:          'Tugas ditandai Selesai',
      };
      toast(labels[status] ?? 'Status tugas diperbarui');
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProject) {
        qc.setQueryData(PROJECT_KEYS.detail(context.projectId), context.previousProject);
      }
      if (context?.previousTech) {
        qc.setQueryData(['technician-dashboard'], context.previousTech);
      }
      toast('Gagal mengubah status tugas', 'error');
    },
    onSettled: (_data, _err, { id, projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSwapTaskOrder() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({ taskA, taskB }: { taskA: { id: number; sort_order: number }; taskB: { id: number; sort_order: number }; projectId: number }) => {
      await Promise.all([
        reorderTask(taskA.id, taskB.sort_order),
        reorderTask(taskB.id, taskA.sort_order),
      ]);
    },
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
    onError: () => { toast('Gagal mengubah urutan tugas', 'error'); },
  });
}

export function useCreateBulkTasks() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ tasks }: { tasks: CreateTaskData[]; projectId: number }) =>
      createBulkTasks(tasks),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Tugas-tugas berhasil ditambahkan');
    },
    onError: () => { toast('Gagal menambahkan tugas', 'error'); },
  });
}
