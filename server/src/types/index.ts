// === Enum Types ===
export type UserRole = 'technician' | 'manager' | 'admin';
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled';
export type ProjectPhase = 'survey' | 'execution';
export type HealthStatus = 'green' | 'amber' | 'red';
export type TaskStatus = 'to_do' | 'working_on_it' | 'done';
export type EvidenceType = 'photo' | 'document' | 'form' | 'screenshot' | 'other';

// === Entity Interfaces ===

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

export interface Client {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  // Computed in list queries
  project_count?: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  client_id?: number;
  start_date: Date;
  end_date: Date;
  duration: number;
  status: ProjectStatus;
  phase: ProjectPhase;
  project_value: number;
  survey_approved: boolean;
  survey_approved_by?: number;
  survey_approved_at?: Date;
  target_description?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  assigned_to?: number;
  status: TaskStatus;
  due_date?: Date;
  timeline_start?: Date;
  timeline_end?: Date;
  notes?: string;
  budget: number;
  sort_order: number;
  is_survey_task: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaskEvidence {
  id: number;
  task_id: number;
  file_path: string;
  file_name: string;
  file_type: EvidenceType;
  file_size: number;
  description?: string;
  uploaded_by: number;
  uploaded_at: Date;
}

export interface Material {
  id: number;
  project_id: number;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: Date;
}

export interface BudgetItem {
  id: number;
  project_id: number;
  category: string;
  description?: string;
  amount: number;
  is_actual: boolean;
  created_at: Date;
}

export interface DailyReport {
  id: number;
  project_id: number;
  task_id?: number;
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
  actual_progress: number;
  planned_progress: number;
  total_tasks: number;
  completed_tasks: number;
  working_tasks: number;
  overtime_tasks: number;
  overdue_tasks: number;
  last_updated: Date;
}

// === Composite / Joined Types ===

export interface ProjectWithHealth extends Project {
  health?: ProjectHealth;
  latest_report?: DailyReport;
  creator?: Pick<User, 'id' | 'name'>;
  client_name?: string;
}

export interface DashboardProject {
  id: number;
  name: string;
  description?: string;
  client_id?: number;
  client_name?: string;
  start_date: Date;
  end_date: Date;
  duration: number;
  status: ProjectStatus;
  phase: ProjectPhase;
  project_value: number;
  spi_value: number | null;
  health_status: HealthStatus | null;
  deviation_percent: number | null;
  actual_progress: number | null;
  planned_progress: number;
  total_tasks: number;
  completed_tasks: number;
  working_tasks: number;
  overtime_tasks: number;
  overdue_tasks: number;
  latest_constraints: string | null;
  last_report_date: Date | null;
  health_last_updated: Date | null;
}

export interface ProjectWithDetail extends Project {
  health?: ProjectHealth;
  client?: Client;
  tasks: Task[];
  materials: Material[];
  budget_items: BudgetItem[];
  daily_reports: DailyReport[];
  assigned_technicians: User[];
}

// === Dashboard Summary ===

export interface DashboardSummary {
  total_projects: number;
  active_projects: number;
  total_red: number;
  total_amber: number;
  total_green: number;
  total_no_health: number;
  avg_spi: number | null;
  total_tasks: number;
  completed_tasks: number;
  working_tasks: number;
  overtime_tasks: number;
  overdue_projects: number;
}

// === Chart Data Types ===

export interface TasksByStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface TasksByOwnerData {
  user_id: number;
  name: string;
  total: number;
  done: number;
  working: number;
  overtime: number;
  to_do: number;
}

export interface TasksByDueDateData {
  month: string;
  to_do: number;
  working_on_it: number;
  done: number;
}

export interface OverdueTasksData {
  project_id: number;
  project_name: string;
  overdue_working: number;
  overdue_todo: number;
}

export interface BudgetStatusData {
  project_id: number;
  name: string;
  planned: number;
  actual: number;
}

export interface EarnedValuePoint {
  date: string;
  pv: number;
  ev: number;
  spi: number;
}

// === Auth Types ===

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

export interface LoginResponse {
  token: string;
  user: User;
}
