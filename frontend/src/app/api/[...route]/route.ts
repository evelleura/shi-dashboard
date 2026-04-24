/**
 * Centralized API Dispatcher
 *
 * All API routes flow through here. Pattern: /api/<resource>[/<id>][/<action>]
 *
 * Auth:        POST /api/auth/login          POST /api/auth/register
 * Users:       GET  /api/users               GET  /api/users/me
 *              GET  /api/users/me/projects    GET  /api/users/technicians
 * Clients:     GET/POST /api/clients          GET/PATCH/DELETE /api/clients/:id
 * Projects:    GET/POST /api/projects         GET/PATCH/DELETE /api/projects/:id
 *              POST /api/projects/:id/approve-survey
 *              POST /api/projects/:id/reject-survey
 *              POST /api/projects/:id/auto-assign
 *              GET/POST /api/projects/:id/assignments
 *              DELETE /api/projects/:id/assignments/:userId
 * Tasks:       POST /api/tasks               POST /api/tasks/bulk
 *              GET/PATCH/DELETE /api/tasks/:id
 *              PATCH /api/tasks/:id/status    POST /api/tasks/:id/reorder
 *              GET /api/tasks/project/:projectId
 * Evidence:    POST /api/evidence/upload      GET /api/evidence/task/:taskId
 *              DELETE /api/evidence/:id       GET /api/evidence/:id/download
 * Dashboard:   GET /api/dashboard             GET /api/dashboard/technician
 *              GET /api/dashboard/search?q=&limit=
 *              GET /api/dashboard/charts/budget-status
 *              GET /api/dashboard/charts/overdue-tasks
 *              GET /api/dashboard/charts/tasks-by-due-date
 *              GET /api/dashboard/charts/tasks-by-owner
 *              GET /api/dashboard/charts/tasks-by-status
 *              GET /api/dashboard/charts/earned-value/:projectId
 *              GET /api/dashboard/charts/project-categories
 *              GET /api/dashboard/charts/technician-workload
 *              GET /api/dashboard/charts/spi-trend
 *              GET /api/dashboard/charts/recent-activity
 *              GET /api/dashboard/technician/productivity
 *              GET /api/dashboard/technician/time-spent
 * Materials:   POST /api/materials            PATCH/DELETE /api/materials/:id
 *              GET /api/materials/project/:projectId
 * Budget:      POST /api/budget               PATCH/DELETE /api/budget/:id
 *              GET /api/budget/project/:projectId
 * Escalations: GET/POST /api/escalations      GET /api/escalations/:id
 *              PATCH /api/escalations/:id/review
 *              PATCH /api/escalations/:id/resolve
 *              GET /api/escalations/summary
 * Activities:  POST /api/activities           GET /api/activities/my/today
 *              GET /api/activities/task/:taskId
 *              POST /api/activities/task/:taskId/timer/start
 *              POST /api/activities/task/:taskId/timer/stop
 */

import { NextRequest, NextResponse } from 'next/server';
import * as auth from '@/lib/handlers/auth';
import * as users from '@/lib/handlers/users';
import * as clients from '@/lib/handlers/clients';
import * as projects from '@/lib/handlers/projects';
import * as tasks from '@/lib/handlers/tasks';
import * as evidence from '@/lib/handlers/evidence';
import * as dashboard from '@/lib/handlers/dashboard';
import * as materials from '@/lib/handlers/materials';
import * as budget from '@/lib/handlers/budget';
import * as escalations from '@/lib/handlers/escalations';
import * as activities from '@/lib/handlers/activities';
import * as audit from '@/lib/handlers/audit';

type Context = { params: Promise<{ route: string[] }> };

function notFound() {
  return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
}

function methodNotAllowed() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

async function dispatch(request: NextRequest, context: Context): Promise<NextResponse> {
  const { route } = await context.params;
  const method = request.method;
  const [r0, r1, r2, r3, r4] = route;

  // ── Auth ─────────────────────────────────────────────────────────────────
  if (r0 === 'auth') {
    if (r1 === 'login' && method === 'POST')    return auth.login(request);
    if (r1 === 'register' && method === 'POST') return auth.register(request);
    return notFound();
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  if (r0 === 'users') {
    if (!r1) {
      if (method === 'GET')  return users.listUsers(request);
      if (method === 'POST') return users.createUser(request);
      return methodNotAllowed();
    }
    if (r1 === 'me' && !r2) {
      if (method === 'GET')   return users.getMe(request);
      if (method === 'PATCH') return users.updateMe(request);
      return methodNotAllowed();
    }
    if (r1 === 'me' && r2 === 'projects') {
      if (method === 'GET') return users.getMyProjects(request);
      return methodNotAllowed();
    }
    if (r1 === 'me' && r2 === 'change-password' && method === 'POST') {
      return users.changeMyPassword(request);
    }
    if (r1 === 'technicians') {
      if (method === 'GET') return users.listTechnicians(request);
      return methodNotAllowed();
    }
    if (r1 && r2 === 'reset-password' && method === 'POST') return users.resetUserPassword(request, r1);
    if (r1 && !r2) {
      if (method === 'PATCH')  return users.updateUser(request, r1);
      if (method === 'DELETE') return users.deleteUser(request, r1);
      return methodNotAllowed();
    }
    return notFound();
  }

  // ── Clients ───────────────────────────────────────────────────────────────
  if (r0 === 'clients') {
    if (!r1) {
      if (method === 'GET')  return clients.listClients(request);
      if (method === 'POST') return clients.createClient(request);
      return methodNotAllowed();
    }
    if (r1 && !r2) {
      if (method === 'GET')    return clients.getClient(request, r1);
      if (method === 'PATCH')  return clients.updateClient(request, r1);
      if (method === 'DELETE') return clients.deleteClient(request, r1);
      return methodNotAllowed();
    }
    return notFound();
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (r0 === 'projects') {
    if (!r1) {
      if (method === 'GET')  return projects.listProjects(request);
      if (method === 'POST') return projects.createProject(request);
      return methodNotAllowed();
    }
    if (r1 && !r2) {
      if (method === 'GET')    return projects.getProject(request, r1);
      if (method === 'PATCH')  return projects.updateProject(request, r1);
      if (method === 'DELETE') return projects.deleteProject(request, r1);
      return methodNotAllowed();
    }
    if (r1 && r2 === 'approve-survey' && method === 'POST') return projects.approveSurvey(request, r1);
    if (r1 && r2 === 'reject-survey'  && method === 'POST') return projects.rejectSurvey(request, r1);
    if (r1 && r2 === 'auto-assign'    && method === 'POST') return projects.autoAssign(request, r1);
    if (r1 && r2 === 'assignments' && !r3) {
      if (method === 'GET')  return projects.listAssignments(request, r1);
      if (method === 'POST') return projects.assignTechnician(request, r1);
      return methodNotAllowed();
    }
    if (r1 && r2 === 'assignments' && r3) {
      if (method === 'DELETE') return projects.unassignTechnician(request, r1, r3);
      return methodNotAllowed();
    }
    return notFound();
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────
  if (r0 === 'tasks') {
    if (!r1) {
      if (method === 'POST') return tasks.createTask(request);
      return methodNotAllowed();
    }
    if (r1 === 'bulk' && method === 'POST') return tasks.bulkCreateTasks(request);
    if (r1 === 'project' && r2) {
      if (method === 'GET') return tasks.getTasksByProject(request, r2);
      return methodNotAllowed();
    }
    if (r1 && !r2) {
      if (method === 'GET')    return tasks.getTask(request, r1);
      if (method === 'PATCH')  return tasks.updateTask(request, r1);
      if (method === 'DELETE') return tasks.deleteTask(request, r1);
      return methodNotAllowed();
    }
    if (r1 && r2 === 'status'  && method === 'PATCH') return tasks.changeTaskStatus(request, r1);
    if (r1 && r2 === 'reorder' && method === 'POST')  return tasks.reorderTask(request, r1);
    return notFound();
  }

  // ── Evidence ──────────────────────────────────────────────────────────────
  if (r0 === 'evidence') {
    if (r1 === 'upload' && method === 'POST') return evidence.uploadEvidence(request);
    if (r1 === 'task' && r2) {
      if (method === 'GET') return evidence.getEvidenceByTask(request, r2);
      return methodNotAllowed();
    }
    if (r1 && !r2) {
      if (method === 'DELETE') return evidence.deleteEvidence(request, r1);
      return methodNotAllowed();
    }
    if (r1 && r2 === 'download' && method === 'GET') return evidence.downloadEvidence(request, r1);
    return notFound();
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  if (r0 === 'dashboard') {
    if (!r1) {
      if (method === 'GET') return dashboard.getDashboard(request);
      return methodNotAllowed();
    }
    if (r1 === 'search' && method === 'GET') return dashboard.globalSearch(request);
    if (r1 === 'technician' && r2 === 'productivity' && method === 'GET') return dashboard.technicianProductivity(request);
    if (r1 === 'technician' && r2 === 'time-spent'   && method === 'GET') return dashboard.technicianTimeSpent(request);
    if (r1 === 'technician' && !r2) {
      if (method === 'GET') return dashboard.getTechnicianDashboard(request);
      return methodNotAllowed();
    }
    if (r1 === 'charts' && r2) {
      if (r2 === 'budget-status'       && method === 'GET') return dashboard.chartBudgetStatus(request);
      if (r2 === 'overdue-tasks'       && method === 'GET') return dashboard.chartOverdueTasks(request);
      if (r2 === 'tasks-by-due-date'   && method === 'GET') return dashboard.chartTasksByDueDate(request);
      if (r2 === 'tasks-by-owner'      && method === 'GET') return dashboard.chartTasksByOwner(request);
      if (r2 === 'tasks-by-status'     && method === 'GET') return dashboard.chartTasksByStatus(request);
      if (r2 === 'earned-value' && r3  && method === 'GET') return dashboard.chartEarnedValue(request, r3);
      if (r2 === 'project-categories'  && method === 'GET') return dashboard.chartProjectCategories(request);
      if (r2 === 'technician-workload' && method === 'GET') return dashboard.chartTechnicianWorkload(request);
      if (r2 === 'spi-trend'           && method === 'GET') return dashboard.chartSPITrend(request);
      if (r2 === 'recent-activity'     && method === 'GET') return dashboard.chartRecentActivity(request);
      return notFound();
    }
    return notFound();
  }

  // ── Materials ─────────────────────────────────────────────────────────────
  if (r0 === 'materials') {
    if (!r1) {
      if (method === 'POST') return materials.createMaterial(request);
      return methodNotAllowed();
    }
    if (r1 === 'project' && r2) {
      if (method === 'GET') return materials.getMaterialsByProject(request, r2);
      return methodNotAllowed();
    }
    if (r1 && !r2) {
      if (method === 'PATCH')  return materials.updateMaterial(request, r1);
      if (method === 'DELETE') return materials.deleteMaterial(request, r1);
      return methodNotAllowed();
    }
    return notFound();
  }

  // ── Budget ────────────────────────────────────────────────────────────────
  if (r0 === 'budget') {
    if (!r1) {
      if (method === 'POST') return budget.createBudgetItem(request);
      return methodNotAllowed();
    }
    if (r1 === 'project' && r2) {
      if (method === 'GET') return budget.getBudgetByProject(request, r2);
      return methodNotAllowed();
    }
    if (r1 && !r2) {
      if (method === 'PATCH')  return budget.updateBudgetItem(request, r1);
      if (method === 'DELETE') return budget.deleteBudgetItem(request, r1);
      return methodNotAllowed();
    }
    return notFound();
  }

  // ── Escalations ───────────────────────────────────────────────────────────
  if (r0 === 'escalations') {
    if (!r1) {
      if (method === 'GET')  return escalations.listEscalations(request);
      if (method === 'POST') return escalations.createEscalation(request);
      return methodNotAllowed();
    }
    if (r1 === 'summary') {
      if (method === 'GET') return escalations.getEscalationSummary(request);
      return methodNotAllowed();
    }
    if (r1 && !r2) {
      if (method === 'GET') return escalations.getEscalation(request, r1);
      return methodNotAllowed();
    }
    if (r1 && r2 === 'review'  && method === 'PATCH') return escalations.reviewEscalation(request, r1);
    if (r1 && r2 === 'resolve' && method === 'PATCH') return escalations.resolveEscalation(request, r1);
    return notFound();
  }

  // ── Activities ────────────────────────────────────────────────────────────
  if (r0 === 'activities') {
    if (!r1) {
      if (method === 'POST') return activities.createActivity(request);
      return methodNotAllowed();
    }
    if (r1 === 'my' && r2 === 'today') {
      if (method === 'GET') return activities.getMyTodayActivities(request);
      return methodNotAllowed();
    }
    if (r1 === 'task' && r2 && !r3) {
      if (method === 'GET') return activities.getActivitiesByTask(request, r2);
      return methodNotAllowed();
    }
    if (r1 === 'task' && r2 && r3 === 'timer' && r4 === 'start' && method === 'POST') {
      return activities.startTimer(request, r2);
    }
    if (r1 === 'task' && r2 && r3 === 'timer' && r4 === 'stop' && method === 'POST') {
      return activities.stopTimer(request, r2);
    }
    return notFound();
  }

  // ── Audit ──────────────────────────────────────────────────────────────────
  if (r0 === 'audit') {
    if (!r1) {
      if (method === 'GET') return audit.listAuditLogs(request);
      return methodNotAllowed();
    }
    return notFound();
  }

  return notFound();
}

export const GET     = (req: NextRequest, ctx: Context) => dispatch(req, ctx);
export const POST    = (req: NextRequest, ctx: Context) => dispatch(req, ctx);
export const PATCH   = (req: NextRequest, ctx: Context) => dispatch(req, ctx);
export const DELETE  = (req: NextRequest, ctx: Context) => dispatch(req, ctx);
export const PUT     = (req: NextRequest, ctx: Context) => dispatch(req, ctx);
