import axios from 'axios';
import type {
  ApiResponse,
  DashboardData,
  LoginResponse,
  Project,
  ProjectWithDetail,
  User,
  Client,
  Task,
  TaskEvidence,
  Material,
  BudgetItem,
  CreateProjectData,
  UpdateProjectData,
  CreateTaskData,
  UpdateTaskData,
  CreateClientData,
  CreateMaterialData,
  CreateBudgetItemData,
  TasksByStatusData,
  TasksByOwnerData,
  OverdueTaskData,
  TasksByDueDateData,
  BudgetStatusData,
  EarnedValueData,
  TechnicianDashboardData,
  TaskStatus,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect on 401 (skip for auth endpoints -- let login page handle its own errors)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ==================== Auth ====================

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
  return res.data.data!;
};

export const register = async (name: string, email: string, password: string, role: string): Promise<LoginResponse> => {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/register', { name, email, password, role });
  return res.data.data!;
};

// ==================== Users ====================

export const getMe = async (): Promise<User> => {
  const res = await api.get<ApiResponse<User>>('/users/me');
  return res.data.data!;
};

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get<ApiResponse<User[]>>('/users');
  return res.data.data!;
};

export const getTechnicians = async (): Promise<User[]> => {
  const res = await api.get<ApiResponse<User[]>>('/users/technicians');
  return res.data.data!;
};

export const getMyProjects = async (): Promise<Project[]> => {
  const res = await api.get<ApiResponse<Project[]>>('/users/me/projects');
  return res.data.data!;
};

// ==================== Clients ====================

export const getClients = async (): Promise<Client[]> => {
  const res = await api.get<ApiResponse<Client[]>>('/clients');
  return res.data.data!;
};

export const getClient = async (id: number): Promise<Client> => {
  const res = await api.get<ApiResponse<Client>>(`/clients/${id}`);
  return res.data.data!;
};

export const createClient = async (data: CreateClientData): Promise<Client> => {
  const res = await api.post<ApiResponse<Client>>('/clients', data);
  return res.data.data!;
};

export const updateClient = async (id: number, data: Partial<CreateClientData>): Promise<Client> => {
  const res = await api.patch<ApiResponse<Client>>(`/clients/${id}`, data);
  return res.data.data!;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

// ==================== Projects ====================

export const getProjects = async (): Promise<Project[]> => {
  const res = await api.get<ApiResponse<Project[]>>('/projects');
  return res.data.data!;
};

export const getProject = async (id: number): Promise<ProjectWithDetail> => {
  const res = await api.get<ApiResponse<ProjectWithDetail>>(`/projects/${id}`);
  return res.data.data!;
};

export const createProject = async (data: CreateProjectData): Promise<Project> => {
  const res = await api.post<ApiResponse<Project>>('/projects', data);
  return res.data.data!;
};

export const updateProject = async (id: number, data: UpdateProjectData): Promise<Project> => {
  const res = await api.patch<ApiResponse<Project>>(`/projects/${id}`, data);
  return res.data.data!;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const getAssignments = async (projectId: number): Promise<User[]> => {
  const res = await api.get<ApiResponse<User[]>>(`/projects/${projectId}/assignments`);
  return res.data.data!;
};

export const assignTechnician = async (projectId: number, userId: number): Promise<void> => {
  await api.post(`/projects/${projectId}/assignments`, { user_id: userId });
};

export const unassignTechnician = async (projectId: number, userId: number): Promise<void> => {
  await api.delete(`/projects/${projectId}/assignments/${userId}`);
};

export const approveSurvey = async (projectId: number): Promise<void> => {
  await api.post(`/projects/${projectId}/approve-survey`);
};

export const rejectSurvey = async (projectId: number): Promise<void> => {
  await api.post(`/projects/${projectId}/reject-survey`);
};

// ==================== Tasks ====================

export const getProjectTasks = async (projectId: number): Promise<Task[]> => {
  const res = await api.get<ApiResponse<Task[]>>(`/tasks/project/${projectId}`);
  return res.data.data!;
};

export const getTask = async (id: number): Promise<Task> => {
  const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
  return res.data.data!;
};

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  const res = await api.post<ApiResponse<Task>>('/tasks', data);
  return res.data.data!;
};

export const updateTask = async (id: number, data: UpdateTaskData): Promise<Task> => {
  const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
  return res.data.data!;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const changeTaskStatus = async (id: number, status: TaskStatus): Promise<Task> => {
  const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
  return res.data.data!;
};

export const createBulkTasks = async (tasks: CreateTaskData[]): Promise<Task[]> => {
  const res = await api.post<ApiResponse<Task[]>>('/tasks/bulk', { tasks });
  return res.data.data!;
};

// ==================== Evidence ====================

export const uploadEvidence = async (taskId: number, file: File, fileType: string, description?: string): Promise<TaskEvidence> => {
  const formData = new FormData();
  formData.append('task_id', String(taskId));
  formData.append('file', file);
  formData.append('file_type', fileType);
  if (description) formData.append('description', description);

  const res = await api.post<ApiResponse<TaskEvidence>>('/evidence/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data!;
};

export const getTaskEvidence = async (taskId: number): Promise<TaskEvidence[]> => {
  const res = await api.get<ApiResponse<TaskEvidence[]>>(`/evidence/task/${taskId}`);
  return res.data.data!;
};

export const deleteEvidence = async (id: number): Promise<void> => {
  await api.delete(`/evidence/${id}`);
};

export const getEvidenceDownloadUrl = (id: number): string => `/api/evidence/${id}/download`;

// ==================== Materials ====================

export const getProjectMaterials = async (projectId: number): Promise<Material[]> => {
  const res = await api.get<ApiResponse<Material[]>>(`/materials/project/${projectId}`);
  return res.data.data!;
};

export const createMaterial = async (data: CreateMaterialData): Promise<Material> => {
  const res = await api.post<ApiResponse<Material>>('/materials', data);
  return res.data.data!;
};

export const updateMaterial = async (id: number, data: Partial<CreateMaterialData>): Promise<Material> => {
  const res = await api.patch<ApiResponse<Material>>(`/materials/${id}`, data);
  return res.data.data!;
};

export const deleteMaterial = async (id: number): Promise<void> => {
  await api.delete(`/materials/${id}`);
};

// ==================== Budget ====================

export const getProjectBudget = async (projectId: number): Promise<BudgetItem[]> => {
  const res = await api.get<ApiResponse<BudgetItem[]>>(`/budget/project/${projectId}`);
  return res.data.data!;
};

export const createBudgetItem = async (data: CreateBudgetItemData): Promise<BudgetItem> => {
  const res = await api.post<ApiResponse<BudgetItem>>('/budget', data);
  return res.data.data!;
};

export const updateBudgetItem = async (id: number, data: Partial<CreateBudgetItemData>): Promise<BudgetItem> => {
  const res = await api.patch<ApiResponse<BudgetItem>>(`/budget/${id}`, data);
  return res.data.data!;
};

export const deleteBudgetItem = async (id: number): Promise<void> => {
  await api.delete(`/budget/${id}`);
};

// ==================== Dashboard ====================

export const getDashboard = async (): Promise<DashboardData> => {
  const res = await api.get<ApiResponse<DashboardData>>('/dashboard');
  return res.data.data!;
};

export const getTasksByStatus = async (): Promise<TasksByStatusData[]> => {
  const res = await api.get<ApiResponse<TasksByStatusData[]>>('/dashboard/charts/tasks-by-status');
  return res.data.data!;
};

export const getTasksByOwner = async (): Promise<TasksByOwnerData[]> => {
  const res = await api.get<ApiResponse<TasksByOwnerData[]>>('/dashboard/charts/tasks-by-owner');
  return res.data.data!;
};

export const getOverdueTasks = async (): Promise<OverdueTaskData[]> => {
  const res = await api.get<ApiResponse<OverdueTaskData[]>>('/dashboard/charts/overdue-tasks');
  return res.data.data!;
};

export const getTasksByDueDate = async (): Promise<TasksByDueDateData[]> => {
  const res = await api.get<ApiResponse<TasksByDueDateData[]>>('/dashboard/charts/tasks-by-due-date');
  return res.data.data!;
};

export const getBudgetStatus = async (): Promise<BudgetStatusData[]> => {
  const res = await api.get<ApiResponse<BudgetStatusData[]>>('/dashboard/charts/budget-status');
  return res.data.data!;
};

export const getEarnedValue = async (projectId: number): Promise<EarnedValueData> => {
  const res = await api.get<ApiResponse<EarnedValueData>>(`/dashboard/charts/earned-value/${projectId}`);
  return res.data.data!;
};

export const getTechnicianDashboard = async (): Promise<TechnicianDashboardData> => {
  const res = await api.get<ApiResponse<TechnicianDashboardData>>('/dashboard/technician');
  return res.data.data!;
};

export default api;
