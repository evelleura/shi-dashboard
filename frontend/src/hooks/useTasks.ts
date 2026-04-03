import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
  createBulkTasks,
} from '../services/api';
import type { CreateTaskData, UpdateTaskData, TaskStatus } from '../types';
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
  return useMutation({
    mutationFn: (data: CreateTaskData) => createTask(data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(variables.project_id) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(variables.project_id) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskData; projectId: number }) =>
      updateTask(id, data),
    onSuccess: (_data, { id, projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; projectId: number }) => deleteTask(id),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useChangeTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus; projectId: number }) =>
      changeTaskStatus(id, status),
    onSuccess: (_data, { id, projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.detail(id) });
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateBulkTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tasks }: { tasks: CreateTaskData[]; projectId: number }) =>
      createBulkTasks(tasks),
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) });
      void qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
