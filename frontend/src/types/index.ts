// === Enums / Union Types ===
export type UserRole = 'technician' | 'manager' | 'admin';
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled';
export type ProjectPhase = 'survey' | 'execution';
export type HealthStatus = 'green' | 'amber' | 'red';
export type TaskStatus = 'to_do' | 'working_on_it' | 'done';
export type EvidenceType = 'photo' | 'document' | 'form' | 'screenshot' | 'other';
export type ActivityType = 'arrival' | 'start_work' | 'pause' | 'resume' | 'note' | 'photo' | 'complete';
export type EscalationStatus = 'open' | 'in_review' | 'resolved';
export type EscalationPriority = 'low' | 'medium' | 'high' | 'critical';

// === Entities ===

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Client {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  project_count?: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  client_id?: number;
  client_name?: string;
  start_date: string;
  end_date: string;
  duration: number;
  status: ProjectStatus;
  phase: ProjectPhase;
  project_value: number;
  survey_approved: boolean;
  survey_approved_by?: number;
  survey_approved_at?: string;
  target_description?: string;
  created_by: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  project_id: number;
  project_name?: string;
  name: string;
  description?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  status: TaskStatus;
  due_date?: string;
  timeline_start?: string;
  timeline_end?: string;
  notes?: string;
  budget: number;
  sort_order: number;
  is_survey_task: boolean;
  timer_started_at?: string;
  time_spent_seconds?: number;
  is_tracking?: boolean;
  estimated_hours?: number;
  evidence_count?: number;
  activity_count?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
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
  uploaded_by_name?: string;
  uploaded_at?: string;
}

export interface TaskActivity {
  id: number;
  task_id: number;
  user_id: number;
  user_name?: string;
  message: string;
  activity_type: ActivityType;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export interface Escalation {
  id: number;
  task_id: number;
  project_id: number;
  reported_by: number;
  reporter_name?: string;
  task_name?: string;
  project_name?: string;
  title: string;
  description: string;
  status: EscalationStatus;
  priority: EscalationPriority;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  resolved_by?: number;
  resolver_name?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EscalationSummary {
  open: number;
  in_review: number;
  resolved: number;
  total?: number;
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
  created_at?: string;
}

export interface BudgetItem {
  id: number;
  project_id: number;
  category: string;
  description?: string;
  amount: number;
  is_actual: boolean;
  created_at?: string;
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
  last_updated: string;
}

// === Dashboard Types ===

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
  over_deadline_tasks: number;
  overdue_projects: number;
  open_escalations?: number;
  in_review_escalations?: number;
}

export interface DashboardProject extends Project {
  spi_value: number | null;
  health_status: HealthStatus | null;
  deviation_percent: number | null;
  actual_progress: number | null;
  planned_progress: number;
  total_tasks: number;
  completed_tasks: number;
}

export interface DashboardData {
  projects: DashboardProject[];
  summary: DashboardSummary;
  recent_activity?: RecentActivity[];
}

export interface RecentActivity {
  type: string;
  project: string;
  task?: string;
  user: string;
  at: string;
}

export interface ProjectWithDetail extends Project {
  health?: ProjectHealth;
  client?: Client;
  tasks: Task[];
  materials: Material[];
  budget_items: BudgetItem[];
  assigned_technicians: User[];
}

// === Chart Data Types ===

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

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

export interface OverdueTaskData {
  project_id: number;
  project_name: string;
  overtime: number;
  over_deadline: number;
}

export interface TasksByDueDateData {
  month: string;
  to_do: number;
  working_on_it: number;
  done: number;
  overtime: number;
  over_deadline: number;
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

export interface EarnedValueData {
  project_id: number;
  timeline: EarnedValuePoint[];
}

export interface TechnicianDashboardData {
  my_tasks: {
    total: number;
    to_do: number;
    working_on_it: number;
    done: number;
    overtime: number;
    over_deadline: number;
  };
  assigned_projects: {
    id: number;
    name: string;
    client_name?: string;
    client_address?: string;
    phase: ProjectPhase;
    health_status?: HealthStatus | null;
    my_task_count: number;
    my_completed: number;
  }[];
  recent_tasks: Task[];
  completed_projects?: {
    id: number;
    name: string;
    client_name?: string;
    client_address?: string;
    status: ProjectStatus;
    phase: ProjectPhase;
    health_status?: HealthStatus | null;
    my_task_count: number;
    my_completed: number;
  }[];
  escalation_summary?: EscalationSummary;
}

// === Form Data Types ===

export interface CreateProjectData {
  name: string;
  description?: string;
  client_id?: number;
  start_date: string;
  end_date: string;
  project_value?: number;
  target_description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
  phase?: ProjectPhase;
  project_value?: number;
  target_description?: string;
}

export interface CreateTaskData {
  project_id: number;
  name: string;
  description?: string;
  assigned_to?: number;
  due_date?: string;
  timeline_start?: string;
  timeline_end?: string;
  notes?: string;
  budget?: number;
  sort_order?: number;
  is_survey_task?: boolean;
}

export interface UpdateTaskData {
  name?: string;
  description?: string;
  assigned_to?: number | null;
  status?: TaskStatus;
  due_date?: string;
  timeline_start?: string;
  timeline_end?: string;
  notes?: string;
  budget?: number;
  sort_order?: number;
  is_survey_task?: boolean;
}

export interface CreateClientData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateMaterialData {
  project_id: number;
  name: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  notes?: string;
}

export interface CreateBudgetItemData {
  project_id: number;
  category: string;
  description?: string;
  amount: number;
  is_actual: boolean;
}

// === API Types ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}
