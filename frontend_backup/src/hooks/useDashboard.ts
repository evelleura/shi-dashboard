import { useQuery } from '@tanstack/react-query';
import {
  getDashboard,
  getTechnicians,
  getTasksByStatus,
  getTasksByOwner,
  getOverdueTasks,
  getTasksByDueDate,
  getEarnedValue,
  getTechnicianDashboard,
  globalSearch,
  getProjectCategories,
  getTechnicianWorkload,
  getSPITrend,
  getRecentActivity,
  getTechnicianProductivity,
  getTechnicianTimeSpent,
} from '../services/api';
import type { DateRange } from '../types';

export const QUERY_KEYS = {
  dashboard: (dr?: DateRange) => ['dashboard', dr] as const,
  technicians: ['technicians'] as const,
  chartTasksByStatus: (dr?: DateRange) => ['charts', 'tasks-by-status', dr] as const,
  chartTasksByOwner: (dr?: DateRange) => ['charts', 'tasks-by-owner', dr] as const,
  chartOverdueTasks: (dr?: DateRange) => ['charts', 'overdue-tasks', dr] as const,
  chartTasksByDueDate: (dr?: DateRange) => ['charts', 'tasks-by-due-date', dr] as const,
  chartEarnedValue: (projectId: number) => ['charts', 'earned-value', projectId] as const,
  technicianDashboard: ['technician-dashboard'] as const,
  globalSearch: (q: string) => ['global-search', q] as const,
  chartProjectCategories: (dr?: DateRange) => ['charts', 'project-categories', dr] as const,
  chartTechnicianWorkload: (dr?: DateRange) => ['charts', 'technician-workload', dr] as const,
  chartSPITrend: (dr?: DateRange) => ['charts', 'spi-trend', dr] as const,
  chartRecentActivity: (dr?: DateRange) => ['charts', 'recent-activity', dr] as const,
  techProductivity: (dr?: DateRange) => ['tech', 'productivity', dr] as const,
  techTimeSpent: (dr?: DateRange) => ['tech', 'time-spent', dr] as const,
};

export function useDashboard(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard(dateRange),
    queryFn: () => getDashboard(dateRange),
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

export function useTasksByStatusChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartTasksByStatus(dateRange),
    queryFn: () => getTasksByStatus(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTasksByOwnerChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartTasksByOwner(dateRange),
    queryFn: () => getTasksByOwner(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}

export function useOverdueTasksChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartOverdueTasks(dateRange),
    queryFn: () => getOverdueTasks(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTasksByDueDateChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartTasksByDueDate(dateRange),
    queryFn: () => getTasksByDueDate(dateRange),
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

export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: QUERY_KEYS.globalSearch(q),
    queryFn: () => globalSearch(q),
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useProjectCategoriesChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartProjectCategories(dateRange),
    queryFn: () => getProjectCategories(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTechnicianWorkloadChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartTechnicianWorkload(dateRange),
    queryFn: () => getTechnicianWorkload(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSPITrendChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartSPITrend(dateRange),
    queryFn: () => getSPITrend(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecentActivityFeed(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.chartRecentActivity(dateRange),
    queryFn: () => getRecentActivity(dateRange ? { start: dateRange.start, end: dateRange.end } : undefined),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTechProductivityChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.techProductivity(dateRange),
    queryFn: () => getTechnicianProductivity(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTechTimeSpentChart(dateRange?: DateRange) {
  return useQuery({
    queryKey: QUERY_KEYS.techTimeSpent(dateRange),
    queryFn: () => getTechnicianTimeSpent(dateRange),
    staleTime: 1000 * 60 * 2,
  });
}
