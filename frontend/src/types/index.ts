export type UserRole = 'technician' | 'manager' | 'admin';
export type ProjectStatus = 'active' | 'completed' | 'on-hold';
export type HealthStatus = 'green' | 'amber' | 'red';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  duration: number;
  status: ProjectStatus;
  created_at?: string;
  created_by_name?: string;
}

export interface DailyReport {
  id: number;
  project_id: number;
  project_name?: string;
  report_date: string;
  progress_percentage: number;
  constraints?: string;
  created_by: number;
  reporter_name?: string;
  created_at?: string;
}

export interface ProjectHealth {
  project_id: number;
  spi_value: number;
  status: HealthStatus;
  deviation_percent: number;
  actual_progress: number;
  planned_progress: number;
  last_updated: string;
}

export interface DashboardProject extends Project {
  spi_value: number | null;
  health_status: HealthStatus | null;
  deviation_percent: number | null;
  actual_progress: number | null;
  planned_progress: number;
  latest_constraints: string | null;
  last_report_date: string | null;
  health_last_updated: string | null;
  last_reported_progress: number | null;
}

export interface DashboardSummary {
  total_active: number;
  total_red: number;
  total_amber: number;
  total_green: number;
  total_no_report: number;
  avg_spi: number | null;
}

export interface DashboardData {
  projects: DashboardProject[];
  summary: DashboardSummary;
  recent_reports: DailyReport[];
}

export interface ProjectWithDetail extends Project {
  spi_value?: number;
  health_status?: HealthStatus;
  deviation_percent?: number;
  actual_progress?: number;
  planned_progress?: number;
  health_last_updated?: string;
  daily_reports: DailyReport[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
