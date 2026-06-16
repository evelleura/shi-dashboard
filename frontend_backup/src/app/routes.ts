/**
 * Application Routes
 * Single source of truth for all page routes and their view components.
 *
 * Manager/Admin routes: /dashboard, /projects, /projects/:id, /clients, /escalations
 * Technician routes:    /my-dashboard, /my-projects, /my-tasks, /my-escalations
 */

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',

  // Manager / Admin
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string | number) => `/projects/${id}`,
  CLIENTS: '/clients',
  ESCALATIONS: '/escalations',

  // Technician
  MY_DASHBOARD: '/my-dashboard',
  MY_PROJECTS: '/my-projects',
  MY_TASKS: '/my-tasks',
  MY_ESCALATIONS: '/my-escalations',
} as const;
