# Project Memory: PT Smart Home Inovasi Dashboard

## Project Overview
**Title:** Dashboard Development for Project Management System Based on Daily Reports
**Author:** Dian Putri Iswandi (5220311118)
**Institution:** Universitas Teknologi Yogyakarta
**Year:** 2026

## Core Problem Statement
PT Smart Home Inovasi (SHI) lacks:
1. Direct field technician access to report system (currently indirect)
2. Visual dashboard for project health monitoring
3. Early Warning System (EWS) for at-risk projects
4. Objective decision-making criteria for prioritization

**Business Impact:** Reactive (not preventive) problem detection -- delays and customer dissatisfaction

## Solution Architecture

### Tech Stack (CONFIRMED)
- **Frontend:** Vite + React 19 + TanStack Query 5 + Recharts 3 + Tailwind CSS v4
- **Backend:** Node.js + Express 5 + TypeScript
- **Database:** PostgreSQL (raw queries via pg, parameterized)
- **File Storage:** Local disk (server/uploads/)
- **Scope:** Greenfield (build from scratch)
- **Scale:** Enterprise (100+ projects)

### Key Metrics & Thresholds
- **SPI Calculation (Primary):** Task completion ratio: `SPI = (completed_tasks / total_tasks) / (elapsed_days / total_project_days)`
- **SPI Fallback:** If no tasks exist, uses `daily_reports.progress_percentage / planned_value`
- **Planned Value (PV):** `(Days Elapsed / Total Project Duration) x 100%`
- **Health Status Thresholds:**
  - Green: SPI >= 0.95 (on track)
  - Amber: 0.85 <= SPI < 0.95 (warning)
  - Red: SPI < 0.85 (critical - behind schedule)
- **Overtime:** status=working_on_it AND due_date < today (computed, not a DB status)
- **Over Deadline:** status=to_do AND due_date < today (computed, not a DB status)
- **Recalculation triggers:** Task status change, task create/delete

### User Roles
1. **Field Technician:** View assigned projects/clients, manage tasks (to_do/working_on_it only -- CANNOT mark done), upload evidence per task, view Kanban/table with computed Overtime/Over Deadline columns
2. **Project Manager:** Full CRUD (clients, projects, tasks, budget, materials), analytics dashboard, approve surveys, mark tasks "done" (review gate)
3. **Admin:** User management, system-wide access

## Data Model (PostgreSQL - 8 Tables)
```
users
  id, name, email, role (technician|manager|admin), password_hash, created_at

clients (NEW)
  id, name, address, phone, email, notes, created_at

projects (EXPANDED)
  id, name, description, client_id (FK), start_date, end_date, status,
  project_value (rupiah), phase (survey|execution), survey_approved,
  created_by (FK), created_at, updated_at

project_assignments
  id, project_id (FK), user_id (FK), role, assigned_at

tasks (NEW - core addition)
  id, project_id (FK), title, description, assigned_to (FK),
  status (to_do|working_on_it|done), due_date, sort_order, created_at, updated_at

task_evidence (NEW)
  id, task_id (FK), file_path, file_name, file_type, file_size, uploaded_by (FK), created_at

materials (NEW)
  id, project_id (FK), name, quantity, unit, unit_price, notes, created_at

budget_items (NEW)
  id, project_id (FK), description, category, amount, notes, created_at

daily_reports (MODIFIED)
  id, project_id (FK), task_id (FK, nullable), report_date, progress_percentage,
  constraints, notes, created_by (FK), created_at

project_health (EXPANDED)
  project_id (FK), spi_value, status, deviation_percent, actual_progress,
  planned_progress, total_tasks, completed_tasks, last_updated
```

## API Endpoints (52 Total)
**Auth (4):** login, register, me, logout
**Users (4):** CRUD + technicians list
**Clients (5):** CRUD + search
**Projects (8):** CRUD + assignments + survey approval + auto-assign tasks
**Tasks (8):** CRUD + status change + by-project + my-tasks + bulk create
**Evidence (4):** Upload (multer) + list + download + delete
**Dashboard (7):** Summary + health overview + chart data (status distribution, task breakdown, overdue, technician workload, earned value)
**Materials (4):** CRUD by project
**Budget (4):** CRUD by project

## Frontend Architecture
**Pages (10):** Dashboard, Projects, ProjectDetail, Clients, TechnicianDashboard, TechnicianProjects, TechnicianTasks, Login, Landing
**Charts (8):** ProjectHealthPie, TasksByStatus, TasksByOwner, TasksByDueDate, OverdueTasks, BudgetStatus, EarnedValue, SummaryStatsCards
**Tasks (7):** KanbanBoard, KanbanCard, TaskTable, TaskDetailModal, TaskForm, TaskStatusSelect, ViewToggle
**Projects (3):** ProjectForm, MaterialsList, BudgetTable
**Evidence (2):** EvidenceUploader, EvidenceGallery
**UI (5):** Layout, StatusBadge, ProgressBar, Modal, EmptyState, ConfirmDialog

## Scope Boundaries
### INCLUDED
- Task-level management with Kanban + table views
- Client management (CRUD)
- Budget tracking per project
- Materials tracking per project
- Evidence upload per task (photos, docs, screenshots)
- Two-phase project lifecycle (survey -> execution)
- SPI from task completion ratio
- 8 chart types (pie, bar, line, stacked bar, earned value)
- Auto-assign tasks to technicians
- Role-based access (technician, manager, admin)
- Real-time dashboard with TanStack Query

### EXCLUDED
- Gantt charts
- Drag-and-drop Kanban (click-to-change instead)
- Cloud file storage (uses local disk)
- Complex approval workflows beyond survey gate
- Custom SPI threshold configuration

## PROJECT MEMORY

| Date | Cat | Score | Learning | Action |
|------|-----|-------|----------|--------|
| 2026-04-04 | ACC | 16 | CLAUDE.md data model (daily_reports + progress %) diverged from user stories which require: task-level tracking, survey phases, evidence uploads, Kanban views, budget planning, client management, auto-assign, project value in rupiah. RESOLVED: Full rewrite completed. | Before implementing features: reconcile CLAUDE.md spec with `docs/user-story/user-stories.md`. Update data model FIRST. |
| 2026-04-04 | ACC | 18 | Full rewrite: 27 files modified, 37 new source files, 3384 insertions. Backend: 52 endpoints, 8 tables. Frontend: 8 charts, Kanban board, 9 pages. Both compile clean (0 TS errors). Strategy-first approach (explore -> strategize -> implement in parallel) completed in one session. | For large rewrites: explore all source materials first, design strategy with complete spec, then deploy backend + frontend builders in parallel. |
| 2026-04-04 | FIX | 19 | Manual daily reports with user-typed percentage are an anti-pattern. Task status changes ARE the daily report. Building a report form on top of task tracking asks users to report the same data twice. User angry: "not some bullshit that I can fill the percentage myself." Removed entire daily report feature. | Before building any "report" feature: ask "Is this data already captured by task status changes?" If yes, auto-derive it. Never ask users to enter what the system already knows. |
| 2026-04-04 | FIX | 16 | Technician CANNOT mark tasks "done" -- only manager reviews and approves completion. Technician role = field worker who reports progress (to_do/working_on_it). Manager role = reviewer who approves (marks done). Previous implementation gave technicians full status control, violating the review gate. | Map real-world workflow before implementing role permissions. "Who does the work?" vs "Who approves the work?" are always different roles. Status transitions must reflect approval chains. |
| 2026-04-04 | FIX | 14 | Computed states (overtime/over_deadline from date comparison) beat manual states (stuck). "Stuck" requires self-reporting; overtime is an objective fact. DB statuses reduced to 3 (to_do, working_on_it, done). Kanban shows 5 visual columns with 2 computed. | Before adding manual status: ask "Can the system compute this from existing data?" Prefer computed indicators over self-reported states. |
| 2026-04-04 | FIX | 13 | Dashboard API returned only 5 columns for task list but detail modal needed 12+ fields. Showed "Unassigned" and "Budget: --". LIMIT 10 silently cut off tasks. | When list view has click-for-details modal, API must return ALL fields the modal needs. Check modal props against SELECT columns before shipping. |
| 2026-04-04 | ACC | 12 | Portable PostgreSQL auto-install (run.py downloads PG 17.5 binaries, extracts, initdb, pg_ctl start). Zero Docker/system-install dependency. | For projects needing PG: use portable binaries from get.enterprisedb.com. Extract pgsql/, initdb -A trust, pg_ctl start. Add postgres/ to .gitignore. |

## Success Criteria
- Technicians can manage tasks via Kanban or table view
- Technicians can upload evidence per task
- SPI auto-calculated from task completion ratio
- Dashboard displays all active projects with RAG status and 8 chart types
- Projects sorted by criticality (red -> amber -> green)
- Real-time updates after task status change
- Manager has full project lifecycle management (client -> project -> tasks -> budget)
- Two-phase workflow: survey -> approval -> execution
- Handles 100+ projects efficiently
- Data accuracy verified
- UAT approval achieved
