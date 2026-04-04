import { useQuery } from '@tanstack/react-query';
import {
  getDashboard,
  getTechnicians,
  getTasksByStatus,
  getTasksByOwner,
  getOverdueTasks,
  getTasksByDueDate,
  getBudgetStatus,
  getEarnedValue,
  getTechnicianDashboard,
} from '../services/api';

export const QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  technicians: ['technicians'] as const,
  chartTasksByStatus: ['charts', 'tasks-by-status'] as const,
  chartTasksByOwner: ['charts', 'tasks-by-owner'] as const,
  chartOverdueTasks: ['charts', 'overdue-tasks'] as const,
  chartTasksByDueDate: ['charts', 'tasks-by-due-date'] as const,
  chartBudgetStatus: ['charts', 'budget-status'] as const,
  chartEarnedValue: (projectId: number) => ['charts', 'earned-value', projectId] as const,
  technicianDashboard: ['technician-dashboard'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: getDashboard,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useTechnicians() {
  return useQuery({
    queryKey: QUERY_KEYS.technicians,
    queryFn: getTechnicians,
    staleTime: 1000 * 60 * 5,
  });
}

// === Chart hooks ===

export function useTasksByStatusChart() {
  return useQuery({
    queryKey: QUERY_KEYS.chartTasksByStatus,
    queryFn: getTasksByStatus,
    staleTime: 1000 * 60 * 2,
  });
}

export function useTasksByOwnerChart() {
  return useQuery({
    queryKey: QUERY_KEYS.chartTasksByOwner,
    queryFn: getTasksByOwner,
    staleTime: 1000 * 60 * 2,
  });
}

export function useOverdueTasksChart() {
  return useQuery({
    queryKey: QUERY_KEYS.chartOverdueTasks,
    queryFn: getOverdueTasks,
    staleTime: 1000 * 60 * 2,
  });
}

export function useTasksByDueDateChart() {
  return useQuery({
    queryKey: QUERY_KEYS.chartTasksByDueDate,
    queryFn: getTasksByDueDate,
    staleTime: 1000 * 60 * 2,
  });
}

export function useBudgetStatusChart() {
  return useQuery({
    queryKey: QUERY_KEYS.chartBudgetStatus,
    queryFn: getBudgetStatus,
    staleTime: 1000 * 60 * 2,
  });
}

export function useEarnedValueChart(projectId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.chartEarnedValue(projectId),
    queryFn: () => getEarnedValue(projectId),
    staleTime: 1000 * 60 * 2,
    enabled: projectId > 0,
  });
}

export function useTechnicianDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.technicianDashboard,
    queryFn: getTechnicianDashboard,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 3,
  });
}
