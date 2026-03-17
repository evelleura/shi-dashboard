import axios from 'axios';
import type { ApiResponse, DashboardData, DailyReport, LoginResponse, Project, ProjectWithDetail, User } from '../types';

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

// Redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
  return res.data.data!;
};

export const register = async (name: string, email: string, password: string, role: string): Promise<LoginResponse> => {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/register', { name, email, password, role });
  return res.data.data!;
};

// Dashboard
export const getDashboard = async (): Promise<DashboardData> => {
  const res = await api.get<ApiResponse<DashboardData>>('/dashboard');
  return res.data.data!;
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
  const res = await api.get<ApiResponse<Project[]>>('/projects');
  return res.data.data!;
};

export const getProject = async (id: number): Promise<ProjectWithDetail> => {
  const res = await api.get<ApiResponse<ProjectWithDetail>>(`/projects/${id}`);
  return res.data.data!;
};

export const createProject = async (data: { name: string; description?: string; start_date: string; end_date: string }): Promise<Project> => {
  const res = await api.post<ApiResponse<Project>>('/projects', data);
  return res.data.data!;
};

export const updateProject = async (id: number, data: Partial<{ name: string; description: string; status: string }>): Promise<Project> => {
  const res = await api.patch<ApiResponse<Project>>(`/projects/${id}`, data);
  return res.data.data!;
};

// Assignments
export const getAssignments = async (projectId: number): Promise<User[]> => {
  const res = await api.get<ApiResponse<User[]>>(`/projects/${projectId}/assignments`);
  return res.data.data!;
};

export const assignTechnician = async (projectId: number, userId: number): Promise<void> => {
  await api.post(`/projects/${projectId}/assignments`, { user_id: userId });
};

// Daily Reports
export const submitReport = async (data: { project_id: number; report_date: string; progress_percentage: number; constraints?: string }) => {
  const res = await api.post<ApiResponse<{ report: DailyReport }>>('/daily-reports', data);
  return res.data.data!;
};

export const getReports = async (params?: { project_id?: number; from?: string; to?: string }): Promise<DailyReport[]> => {
  const res = await api.get<ApiResponse<DailyReport[]>>('/daily-reports', { params });
  return res.data.data!;
};

// Users
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

export default api;
