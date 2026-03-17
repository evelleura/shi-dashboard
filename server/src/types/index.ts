export type UserRole = 'technician' | 'manager' | 'admin';

export type ProjectStatus = 'active' | 'completed' | 'on-hold';

export type HealthStatus = 'green' | 'amber' | 'red';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: Date;
}

export interface AuthUser extends User {
  password_hash: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  duration: number;
  status: ProjectStatus;
  created_at: Date;
}

export interface DailyReport {
  id: number;
  project_id: number;
  report_date: Date;
  progress_percentage: number;
  constraints?: string;
  created_by: number;
  created_at: Date;
}

export interface ProjectHealth {
  project_id: number;
  spi_value: number;
  status: HealthStatus;
  deviation_percent: number;
  last_updated: Date;
}

export interface ProjectWithHealth extends Project {
  health?: ProjectHealth;
  latest_report?: DailyReport;
  creator?: Pick<User, 'id' | 'name'>;
}

export interface DashboardProject {
  id: number;
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  duration: number;
  status: ProjectStatus;
  spi_value: number | null;
  health_status: HealthStatus | null;
  deviation_percent: number | null;
  actual_progress: number | null;
  planned_progress: number;
  latest_constraints: string | null;
  last_report_date: Date | null;
  health_last_updated: Date | null;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
