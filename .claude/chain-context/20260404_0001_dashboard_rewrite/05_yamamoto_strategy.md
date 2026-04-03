---
task_id: "20260404_0001_dashboard_rewrite"
agent: "yamamoto"
phase: "validation"
status: "COMPLETE"
timestamp: "2026-04-04T03:30:00Z"
---

# STRATEGIC ANALYSIS: SHI Dashboard Complete Rewrite Specification

```yaml
STRATEGIC_ANALYSIS:
  decision: PROCEED
  recommended_approach: "Incremental migration - expand schema first, then backend, then frontend"
  tradeoffs:
    pros:
      - "Existing auth, SPI core, TanStack patterns are solid - reuse saves 30% effort"
      - "Task-based SPI model aligns with user stories AND thesis formula"
      - "Normalized schema enables all dashboard charts without complex queries"
    cons:
      - "Schema migration requires careful sequencing (FK dependencies)"
      - "SPI calculator rewrite changes the fundamental EV source"
      - "Full scope (Kanban + table + 8 chart types) is ambitious"
  risks:
    - "Schema migration could break seed data - mitigate with clean migration SQL"
    - "File upload infrastructure is net-new capability"
    - "Survey approval workflow adds state machine complexity"
  implementation_notes:
    - "Backend-first: schema -> SPI engine -> API -> frontend"
    - "Keep existing auth system intact throughout"
    - "Use multer for file uploads to server/uploads/"
  validation_focus:
    security: "Registration endpoint needs role restriction, file upload needs type/size validation"
    quality: "SPI calculation must be unit-tested with known scenarios"
    build: "PostgreSQL migration must be idempotent (IF NOT EXISTS everywhere)"
```

---

## TABLE OF CONTENTS

1. [Database Schema](#1-database-schema)
2. [API Endpoints](#2-api-endpoints)
3. [Frontend Architecture](#3-frontend-architecture)
4. [SPI Calculation Engine](#4-spi-calculation-engine)
5. [Implementation Order](#5-implementation-order)
6. [Keep vs Rebuild Matrix](#6-keep-vs-rebuild-matrix)

---

## 1. DATABASE SCHEMA

### Design Principles
- Normalized tables for cross-project queries and dashboard aggregation
- Foreign keys with CASCADE deletes where parent deletion should cascade
- RESTRICT deletes where orphaned records would be dangerous
- Indexes on all columns used in WHERE clauses and JOINs
- CHECK constraints for enum-like columns
- GENERATED columns where computation is deterministic

### 1.1 Complete Schema

#### Table: `users` (KEEP, no changes)
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT role_check CHECK (role IN ('technician', 'manager', 'admin'))
);
```
**No changes needed.** The existing users table supports all three roles. Avatar is deferred (not critical for thesis).

---

#### Table: `clients` (NEW)
```sql
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
```

**Rationale:** User stories M-01 and M-03 require client registration with contact details. One client can have multiple projects.

---

#### Table: `projects` (MODIFY - significant expansion)
```sql
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id INT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INT GENERATED ALWAYS AS (end_date - start_date) STORED,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  phase VARCHAR(50) NOT NULL DEFAULT 'survey',
  project_value DECIMAL(15,2) DEFAULT 0,
  survey_approved BOOLEAN DEFAULT FALSE,
  survey_approved_by INT,
  survey_approved_at TIMESTAMP,
  target_description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (survey_approved_by) REFERENCES users(id),
  CONSTRAINT status_check CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
  CONSTRAINT phase_check CHECK (phase IN ('survey', 'execution')),
  CONSTRAINT date_order CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(phase);
```

**Changes from current:**
- ADD `client_id` -- links to clients table (SET NULL on client deletion to preserve project history)
- ADD `phase` -- 'survey' or 'execution' (survey must be approved before execution)
- ADD `project_value` -- monetary value in Rupiah (M-12)
- ADD `survey_approved`, `survey_approved_by`, `survey_approved_at` -- survey gate (M-11)
- ADD `target_description` -- project goal/endpoint document (T-09)
- ADD `updated_at` -- track last modification
- ADD `cancelled` to status CHECK -- for abandoned projects
- ADD `date_order` constraint -- prevent end_date <= start_date
- KEEP `duration` GENERATED column -- auto-computed, useful

---

#### Table: `project_assignments` (KEEP, no changes)
```sql
CREATE TABLE IF NOT EXISTS project_assignments (
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Reasoning:** Project-level assignment is still needed for portfolio-level access control (technician sees assigned projects). Task-level assignment is ADDITIONALLY needed (see tasks table).

---

#### Table: `tasks` (NEW - core addition)
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  assigned_to INT,
  status VARCHAR(50) NOT NULL DEFAULT 'to_do',
  due_date DATE,
  timeline_start DATE,
  timeline_end DATE,
  notes TEXT,
  budget DECIMAL(15,2) DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_survey_task BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT task_status_check CHECK (status IN ('to_do', 'working_on_it', 'done', 'stuck'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_order ON tasks(project_id, sort_order);
```

**This is the most critical new table.** It enables:
- Task-level granularity (each task = one work item)
- Kanban view (group by status column)
- Table view (all columns visible)
- SPI calculation (completed tasks / expected tasks)
- Budget tracking (per-task budget, sum = project budget)
- Assignment tracking (per-task technician)
- Survey vs execution task differentiation

**Status values match Monday.com reference:** to_do, working_on_it, done, stuck.

---

#### Table: `task_evidence` (NEW)
```sql
CREATE TABLE IF NOT EXISTS task_evidence (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  description TEXT,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  CONSTRAINT evidence_type_check CHECK (file_type IN ('photo', 'document', 'form', 'screenshot', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_task ON task_evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON task_evidence(uploaded_by);
```

**Rationale:** User stories T-06, M-11 require evidence upload per task. Files stored on local disk at `server/uploads/`, `file_path` stores relative path.

**File storage convention:**
```
server/uploads/
  projects/{project_id}/
    tasks/{task_id}/
      {timestamp}_{original_filename}
```

---

#### Table: `materials` (NEW)
```sql
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'pcs',
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
```

**Rationale:** User stories M-07 require material/equipment tracking ("barang yang di-indent"). Total auto-computed.

---

#### Table: `budget_items` (NEW)
```sql
CREATE TABLE IF NOT EXISTS budget_items (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_actual BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budget_project ON budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_category ON budget_items(category);
```

**Rationale:** User stories M-04 require budget plan (RAB). Two types: planned (`is_actual = false`) and actual (`is_actual = true`). Enables Budget Status chart (planned vs actual).

---

#### Table: `daily_reports` (MODIFY - add task_id reference)
```sql
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  task_id INT,
  report_date DATE NOT NULL,
  progress_percentage DECIMAL(5,2) NOT NULL,
  constraints TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE (project_id, report_date, created_by)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date
  ON daily_reports(project_id, report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_task
  ON daily_reports(task_id);
```

**Changes:**
- ADD `task_id` -- optional FK to tasks table. When present, report is about a specific task. When NULL, it is a project-level report.
- KEEP existing structure -- backward compatible with current SPI flow.

**IMPORTANT DESIGN DECISION:** Daily reports are KEPT as an entity. The user stories describe task-level evidence uploads, but the thesis explicitly requires daily reports for SPI calculation. The system supports BOTH:
1. Task status changes (to_do -> working_on_it -> done) drive SPI via task completion ratio
2. Daily reports remain as an optional project-level progress log for the manager view

The PRIMARY SPI source is now task completion ratio, NOT daily_reports.progress_percentage.

---

#### Table: `project_health` (MODIFY - add task-based metrics)
```sql
CREATE TABLE IF NOT EXISTS project_health (
  project_id INT PRIMARY KEY,
  spi_value DECIMAL(6,4),
  status VARCHAR(50),
  deviation_percent DECIMAL(6,2),
  actual_progress DECIMAL(5,2),
  planned_progress DECIMAL(5,2),
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  working_tasks INT DEFAULT 0,
  stuck_tasks INT DEFAULT 0,
  overdue_tasks INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT health_status_check CHECK (status IN ('green', 'amber', 'red'))
);
```

**Changes:**
- ADD `total_tasks`, `completed_tasks`, `working_tasks`, `stuck_tasks`, `overdue_tasks` -- task breakdown for dashboard widgets and summary cards
- KEEP existing SPI/status/deviation fields

---

### 1.2 Entity Relationship Summary

```
users ─────────────┐
  │                 │
  │ created_by      │ assigned_to
  ▼                 ▼
clients ──── projects ──── tasks ──── task_evidence
               │  │          │
               │  │          └──── daily_reports (optional task_id)
               │  │
               │  ├──── project_assignments (many-to-many users)
               │  ├──── project_health (1:1 denormalized)
               │  ├──── materials
               │  └──── budget_items
               │
               └──── daily_reports (project-level)
```

### 1.3 Migration Strategy

**Approach: Additive migration (no DROP, no data loss)**

```sql
-- Migration 002: Add new tables and columns for rewrite
-- Run AFTER initial schema (001_initial / schema.sql)

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients ( ... );

-- 2. Alter projects table (add columns)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id INT REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase VARCHAR(50) NOT NULL DEFAULT 'execution';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS survey_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS survey_approved_by INT REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS survey_approved_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- Add phase check (drop old status check first if needed, then recreate)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS phase_check;
ALTER TABLE projects ADD CONSTRAINT phase_check CHECK (phase IN ('survey', 'execution'));
-- Expand status check
ALTER TABLE projects DROP CONSTRAINT IF EXISTS status_check;
ALTER TABLE projects ADD CONSTRAINT status_check CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled'));

-- 3. Create tasks table
CREATE TABLE IF NOT EXISTS tasks ( ... );

-- 4. Create task_evidence table
CREATE TABLE IF NOT EXISTS task_evidence ( ... );

-- 5. Create materials table
CREATE TABLE IF NOT EXISTS materials ( ... );

-- 6. Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items ( ... );

-- 7. Alter daily_reports (add task_id)
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS task_id INT REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_daily_reports_task ON daily_reports(task_id);

-- 8. Alter project_health (add task counters)
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS total_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS completed_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS working_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS stuck_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS overdue_tasks INT DEFAULT 0;

-- 9. Set existing projects to execution phase (they have no survey concept)
UPDATE projects SET phase = 'execution', survey_approved = TRUE WHERE phase = 'survey';
```

**All existing data survives.** New columns have defaults. Existing projects get `phase='execution'` and `survey_approved=true` so they continue working.

---

## 2. API ENDPOINTS

### Design Principles
- Follow existing `ApiResponse<T>` envelope: `{ success: boolean, data?: T, message?: string, error?: string }`
- Follow existing auth pattern: `authenticate` + `authorize('role1', 'role2')` middleware
- RESTful resource-based routing
- Request validation at route level, not middleware (keep it simple for thesis scope)

### 2.1 Auth Routes (`/api/auth`) -- KEEP

| Method | Endpoint | Auth | Roles | Description | Changes |
|--------|----------|------|-------|-------------|---------|
| POST | `/login` | No | All | JWT login | NO CHANGE |
| POST | `/register` | No | All | Registration | **MODIFY**: Add manager registration protection (require invite code or admin approval) |

**Security note for validators:** Registration is currently open to anyone including manager role. This should be locked down so only admins can create manager accounts.

### 2.2 User Routes (`/api/users`) -- KEEP

| Method | Endpoint | Auth | Roles | Description | Changes |
|--------|----------|------|-------|-------------|---------|
| GET | `/me` | JWT | All | Current user | NO CHANGE |
| GET | `/` | JWT | manager/admin | All users | NO CHANGE |
| GET | `/technicians` | JWT | manager/admin | Technician list | NO CHANGE |
| GET | `/me/projects` | JWT | technician | My assigned projects | **MODIFY**: Include task counts per project |

### 2.3 Client Routes (`/api/clients`) -- NEW

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | JWT | manager/admin | List all clients (with project count) |
| GET | `/:id` | JWT | manager/admin | Single client with projects |
| POST | `/` | JWT | manager/admin | Create client |
| PATCH | `/:id` | JWT | manager/admin | Update client |
| DELETE | `/:id` | JWT | admin | Delete client (admin only, SET NULL on projects) |

**Request body (POST/PATCH):**
```json
{
  "name": "string (required)",
  "address": "string",
  "phone": "string",
  "email": "string",
  "notes": "string"
}
```

### 2.4 Project Routes (`/api/projects`) -- MODIFY (expand)

| Method | Endpoint | Auth | Roles | Description | Changes |
|--------|----------|------|-------|-------------|---------|
| GET | `/` | JWT | All | List projects + health + task counts | **MODIFY**: Add client_name, phase, task counts, project_value |
| GET | `/:id` | JWT | All | Project detail + tasks + reports + materials + budget | **MODIFY**: Rich response with all related entities |
| POST | `/` | JWT | manager/admin | Create project | **MODIFY**: Accept client_id, project_value, target_description, phase |
| PATCH | `/:id` | JWT | manager/admin | Update project | **MODIFY**: Accept all new fields |
| DELETE | `/:id` | JWT | admin | Delete project | **NEW** |
| GET | `/:id/assignments` | JWT | manager/admin | List assigned technicians | NO CHANGE |
| POST | `/:id/assignments` | JWT | manager/admin | Assign technician | NO CHANGE |
| DELETE | `/:id/assignments/:userId` | JWT | manager/admin | Unassign technician | **NEW** |
| POST | `/:id/auto-assign` | JWT | manager/admin | Auto-assign technicians to tasks | **NEW** |
| POST | `/:id/approve-survey` | JWT | manager/admin | Approve survey, transition to execution phase | **NEW** |
| POST | `/:id/reject-survey` | JWT | manager/admin | Reject survey (technician must redo) | **NEW** |

**Create project request body (POST):**
```json
{
  "name": "string (required)",
  "description": "string",
  "client_id": "number",
  "start_date": "date (required)",
  "end_date": "date (required)",
  "project_value": "number",
  "target_description": "string"
}
```

**Auto-assign request body (POST `/:id/auto-assign`):**
```json
{
  "user_ids": [1, 2, 3]
}
```
Algorithm: Round-robin distribution of unassigned tasks across specified technicians. Tasks assigned in sort_order sequence.

**Project detail response (GET `/:id`):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "...",
    "client": { "id": 1, "name": "...", "phone": "..." },
    "phase": "survey",
    "project_value": 50000000,
    "survey_approved": false,
    "target_description": "...",
    "health": { "spi_value": 0.87, "status": "amber", "..." },
    "tasks": [
      { "id": 1, "name": "...", "status": "done", "assigned_to": { "id": 2, "name": "..." }, "..." }
    ],
    "materials": [...],
    "budget_items": [...],
    "daily_reports": [...],
    "assigned_technicians": [...]
  }
}
```

### 2.5 Task Routes (`/api/tasks`) -- NEW

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/project/:projectId` | JWT | All (scoped) | List tasks for a project (tech sees assigned only) |
| GET | `/:id` | JWT | All | Single task with evidence |
| POST | `/` | JWT | manager/admin | Create task |
| PATCH | `/:id` | JWT | All (restricted) | Update task (tech: status only; manager: all fields) |
| DELETE | `/:id` | JWT | manager/admin | Delete task |
| PATCH | `/:id/status` | JWT | technician/admin | Change task status (triggers SPI recalc) |
| POST | `/:id/reorder` | JWT | manager/admin | Change sort_order |
| POST | `/bulk` | JWT | manager/admin | Create multiple tasks at once |

**Create task request body (POST):**
```json
{
  "project_id": "number (required)",
  "name": "string (required)",
  "description": "string",
  "assigned_to": "number (user_id)",
  "due_date": "date",
  "timeline_start": "date",
  "timeline_end": "date",
  "notes": "string",
  "budget": "number",
  "sort_order": "number",
  "is_survey_task": "boolean"
}
```

**Status change (PATCH `/:id/status`):**
```json
{
  "status": "to_do | working_on_it | done | stuck"
}
```
**Side effect:** On status change to 'done' or from 'done', triggers `recalculateSPI(task.project_id)`.

**Task status transition rules:**
- `to_do` -> `working_on_it` (technician starts work)
- `working_on_it` -> `done` (technician completes, evidence required)
- `working_on_it` -> `stuck` (technician blocked)
- `stuck` -> `working_on_it` (unblocked)
- `done` -> `working_on_it` (reopened by manager)
- Any status -> `to_do` (manager reset)

**Technician restriction:** Technicians can only change status of tasks assigned to them. Managers can change any task.

### 2.6 Evidence/Upload Routes (`/api/evidence`) -- NEW

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/upload` | JWT | technician/admin | Upload file for a task (multipart/form-data) |
| GET | `/task/:taskId` | JWT | All | List evidence for a task |
| GET | `/:id/download` | JWT | All | Download/view a specific file |
| DELETE | `/:id` | JWT | manager/admin | Delete evidence file |

**Upload request (multipart/form-data):**
- `task_id`: number (required)
- `file`: file blob (required, max 10MB)
- `file_type`: 'photo' | 'document' | 'form' | 'screenshot' | 'other'
- `description`: string

**Implementation:** Use `multer` middleware with disk storage. Save to `server/uploads/projects/{project_id}/tasks/{task_id}/`.

**Serve static files:** `app.use('/uploads', express.static('uploads'))` with auth check middleware.

### 2.7 Dashboard Routes (`/api/dashboard`) -- MODIFY (major expansion)

| Method | Endpoint | Auth | Roles | Description | Changes |
|--------|----------|------|-------|-------------|---------|
| GET | `/` | JWT | manager/admin | Main dashboard data | **MODIFY**: Add task-based stats |
| GET | `/charts/tasks-by-status` | JWT | manager/admin | Pie chart data | **NEW** |
| GET | `/charts/tasks-by-owner` | JWT | manager/admin | Bar chart data | **NEW** |
| GET | `/charts/overdue-tasks` | JWT | manager/admin | Overdue bar chart data | **NEW** |
| GET | `/charts/tasks-by-due-date` | JWT | manager/admin | Stacked bar chart data | **NEW** |
| GET | `/charts/budget-status` | JWT | manager/admin | Budget planned vs actual | **NEW** |
| GET | `/charts/earned-value/:projectId` | JWT | All | Earned value trend for a project | **NEW** |
| GET | `/technician` | JWT | technician | Technician-specific dashboard | **NEW** |

**Main dashboard response (GET `/`):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_projects": 25,
      "active_projects": 18,
      "total_red": 3,
      "total_amber": 5,
      "total_green": 10,
      "total_no_health": 0,
      "avg_spi": 0.94,
      "total_tasks": 150,
      "completed_tasks": 87,
      "working_tasks": 40,
      "stuck_tasks": 8,
      "overdue_projects": 2
    },
    "projects": [
      { "... project with health, task counts, client name ..." }
    ],
    "recent_activity": [
      { "type": "task_completed", "project": "...", "task": "...", "user": "...", "at": "..." }
    ]
  }
}
```

**Tasks by status (GET `/charts/tasks-by-status`):**
```json
{
  "data": [
    { "status": "done", "count": 87, "percentage": 58.0 },
    { "status": "working_on_it", "count": 40, "percentage": 26.7 },
    { "status": "stuck", "count": 8, "percentage": 5.3 },
    { "status": "to_do", "count": 15, "percentage": 10.0 }
  ]
}
```

**Tasks by owner (GET `/charts/tasks-by-owner`):**
```json
{
  "data": [
    { "user_id": 2, "name": "Budi", "total": 15, "done": 8, "working": 5, "stuck": 2 },
    { "user_id": 3, "name": "Sari", "total": 12, "done": 10, "working": 2, "stuck": 0 }
  ]
}
```

**Overdue tasks (GET `/charts/overdue-tasks`):**
```json
{
  "data": [
    { "project_id": 1, "project_name": "...", "overdue_working": 3, "overdue_stuck": 1 }
  ]
}
```

**Tasks by due date (GET `/charts/tasks-by-due-date`):**
```json
{
  "data": [
    { "month": "2026-04", "to_do": 5, "working_on_it": 8, "done": 12, "stuck": 2 },
    { "month": "2026-05", "to_do": 3, "working_on_it": 4, "done": 6, "stuck": 1 }
  ]
}
```

**Budget status (GET `/charts/budget-status`):**
```json
{
  "data": [
    { "project_id": 1, "name": "...", "planned": 50000000, "actual": 35000000 }
  ]
}
```

**Earned value analysis (GET `/charts/earned-value/:projectId`):**
```json
{
  "data": {
    "project_id": 1,
    "timeline": [
      { "date": "2026-03-01", "pv": 10.0, "ev": 8.5, "spi": 0.85 },
      { "date": "2026-03-08", "pv": 20.0, "ev": 18.0, "spi": 0.90 },
      { "date": "2026-03-15", "pv": 30.0, "ev": 29.5, "spi": 0.98 }
    ]
  }
}
```

**Technician dashboard (GET `/technician`):**
```json
{
  "data": {
    "my_tasks": {
      "total": 12,
      "to_do": 3,
      "working_on_it": 5,
      "done": 3,
      "stuck": 1,
      "overdue": 2
    },
    "assigned_projects": [
      { "id": 1, "name": "...", "phase": "execution", "my_task_count": 5, "my_completed": 3 }
    ],
    "recent_tasks": [
      { "id": 1, "name": "...", "project_name": "...", "status": "working_on_it", "due_date": "..." }
    ]
  }
}
```

### 2.8 Daily Report Routes (`/api/daily-reports`) -- MODIFY

| Method | Endpoint | Auth | Roles | Description | Changes |
|--------|----------|------|-------|-------------|---------|
| POST | `/` | JWT | technician/admin | Submit report | **MODIFY**: Accept optional task_id |
| GET | `/` | JWT | All (scoped) | List reports | NO CHANGE |

**Changes:** Accept optional `task_id` in POST body. SPI recalculation still triggered. Daily reports are now SUPPLEMENTARY to task-based SPI (kept for thesis compliance).

### 2.9 Material Routes (`/api/materials`) -- NEW

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/project/:projectId` | JWT | All | List materials for a project |
| POST | `/` | JWT | manager/admin | Add material |
| PATCH | `/:id` | JWT | manager/admin | Update material |
| DELETE | `/:id` | JWT | manager/admin | Delete material |

### 2.10 Budget Routes (`/api/budget`) -- NEW

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/project/:projectId` | JWT | All | List budget items (planned + actual) |
| POST | `/` | JWT | manager/admin | Add budget item |
| PATCH | `/:id` | JWT | manager/admin | Update budget item |
| DELETE | `/:id` | JWT | manager/admin | Delete budget item |

### 2.11 Complete Endpoint Count

| Resource | Endpoints | New | Modified | Kept |
|----------|-----------|-----|----------|------|
| Auth | 2 | 0 | 1 | 1 |
| Users | 4 | 0 | 1 | 3 |
| Clients | 5 | 5 | 0 | 0 |
| Projects | 11 | 5 | 2 | 4 |
| Tasks | 8 | 8 | 0 | 0 |
| Evidence | 4 | 4 | 0 | 0 |
| Dashboard | 8 | 7 | 1 | 0 |
| Reports | 2 | 0 | 1 | 1 |
| Materials | 4 | 4 | 0 | 0 |
| Budget | 4 | 4 | 0 | 0 |
| **TOTAL** | **52** | **37** | **6** | **9** |

---

## 3. FRONTEND ARCHITECTURE

### 3.1 Page Structure

```
/                         -> LandingPage (guests) | redirect (auth users)
/login                    -> LoginPage
/dashboard                -> ManagerDashboard [manager/admin]
/projects                 -> ProjectListPage [manager/admin]
/projects/:id             -> ProjectDetailPage [manager/admin]
/projects/:id/tasks       -> ProjectTasksPage [manager/admin] (table + kanban toggle)
/projects/new             -> CreateProjectPage [manager/admin]
/clients                  -> ClientListPage [manager/admin]
/clients/new              -> CreateClientPage [manager/admin]
/my-tasks                 -> TechnicianTasksPage [technician] (kanban + table toggle)
/my-tasks/:taskId         -> TaskDetailPage [technician]
/my-dashboard             -> TechnicianDashboard [technician]
/report                   -> ReportPage [technician] (legacy, keep for now)
```

### 3.2 Component Architecture

```
frontend/src/
  App.tsx                           # Router + providers (MODIFY)
  main.tsx                          # Entry point (KEEP)
  index.css                         # Tailwind (KEEP)

  types/
    index.ts                        # All TypeScript interfaces (REBUILD)

  services/
    api.ts                          # Axios instance + all API functions (MODIFY - expand)

  hooks/
    useAuth.ts                      # Auth state management (KEEP)
    useDashboard.ts                 # Dashboard queries (MODIFY - expand)
    useProjects.ts                  # Project CRUD hooks (NEW, extract from useDashboard)
    useTasks.ts                     # Task CRUD + status change hooks (NEW)
    useClients.ts                   # Client CRUD hooks (NEW)
    useEvidence.ts                  # File upload hooks (NEW)
    useMaterials.ts                 # Material CRUD hooks (NEW)
    useBudget.ts                    # Budget CRUD hooks (NEW)

  pages/
    LandingPage.tsx                 # Company site (KEEP)
    LoginPage.tsx                   # Login form (KEEP)
    dashboard/
      ManagerDashboard.tsx          # Charts + summary + project overview (REBUILD from DashboardPage)
      TechnicianDashboard.tsx       # My tasks summary + assigned projects (NEW)
    projects/
      ProjectListPage.tsx           # Table with client, phase, health, tasks (REBUILD from ProjectsPage)
      ProjectDetailPage.tsx         # Full detail with tabs (REBUILD)
      CreateProjectPage.tsx         # Rich form: client, dates, value, description (REBUILD from CreateProjectForm)
      ProjectTasksPage.tsx          # Task management for a project (NEW)
    tasks/
      TechnicianTasksPage.tsx       # Kanban + table toggle for technician (NEW)
      TaskDetailPage.tsx            # Single task with evidence upload (NEW)
    clients/
      ClientListPage.tsx            # Client table (NEW)
      CreateClientPage.tsx          # Client form (NEW)
    ReportPage.tsx                  # Legacy daily report form (KEEP for thesis compliance)

  components/
    ui/
      Layout.tsx                    # Top nav + sidebar (MODIFY - add more menu items)
      StatusBadge.tsx               # RAG badge (KEEP)
      ProgressBar.tsx               # Dual progress bar (KEEP)
      FileUpload.tsx                # Drag-and-drop file upload (NEW)
      Modal.tsx                     # Reusable modal dialog (NEW)
      DataTable.tsx                 # Reusable sortable/filterable table (NEW)
      EmptyState.tsx                # Empty state placeholder (NEW)
      ConfirmDialog.tsx             # Confirmation dialog (NEW)
    dashboard/
      SummaryCards.tsx              # KPI cards at top (MODIFY - add task counts)
      ProjectHealthGrid.tsx         # Grid of project cards (MODIFY - add task info)
      ProjectCard.tsx               # Individual project card (MODIFY - add phase, tasks, client)
    charts/
      TasksByStatusChart.tsx        # Pie/donut chart (NEW - Recharts PieChart)
      TasksByOwnerChart.tsx         # Horizontal bar chart (NEW - Recharts BarChart)
      OverdueTasksChart.tsx         # Bar chart (NEW - Recharts BarChart)
      TasksByDueDateChart.tsx       # Stacked bar chart (NEW - Recharts BarChart with stackId)
      BudgetStatusChart.tsx         # Bar chart planned vs actual (NEW - Recharts BarChart)
      EarnedValueChart.tsx          # Line chart PV vs EV vs SPI (NEW - Recharts LineChart)
      WorkItemProgressChart.tsx     # Donut chart (NEW - Recharts PieChart with inner radius)
      ProjectHealthPieChart.tsx     # Pie chart green/amber/red distribution (NEW)
    tasks/
      KanbanBoard.tsx              # Kanban columns: To Do | Working On It | Done | Stuck (NEW)
      KanbanCard.tsx               # Individual kanban card (NEW)
      TaskTable.tsx                # Table view of tasks (NEW)
      TaskRow.tsx                  # Single task row (NEW)
      TaskStatusSelect.tsx         # Status dropdown with color coding (NEW)
      TaskForm.tsx                 # Create/edit task form (NEW)
    projects/
      ProjectForm.tsx              # Rich project creation/edit form (REBUILD)
      SurveyApproval.tsx           # Survey evidence review + approve/reject (NEW)
      MaterialsList.tsx            # Materials table with inline edit (NEW)
      BudgetTable.tsx              # Budget items table (NEW)
    evidence/
      EvidenceGallery.tsx          # Grid of uploaded files with preview (NEW)
      EvidenceUploader.tsx         # Upload UI with progress (NEW)
    forms/
      DailyReportForm.tsx          # Legacy report form (KEEP with minor modifications)
```

### 3.3 Chart Library Usage (Recharts -- already installed)

| Chart | Recharts Component | Data Source Endpoint |
|-------|-------------------|---------------------|
| Tasks by Status | `<PieChart>` + `<Pie>` + `<Cell>` | `/api/dashboard/charts/tasks-by-status` |
| Tasks by Owner | `<BarChart>` + `<Bar>` (horizontal via `layout="vertical"`) | `/api/dashboard/charts/tasks-by-owner` |
| Overdue Tasks | `<BarChart>` + `<Bar>` | `/api/dashboard/charts/overdue-tasks` |
| Tasks by Due Date | `<BarChart>` + `<Bar stackId="a">` | `/api/dashboard/charts/tasks-by-due-date` |
| Budget Status | `<BarChart>` + 2x `<Bar>` (planned vs actual) | `/api/dashboard/charts/budget-status` |
| Earned Value | `<LineChart>` + 3x `<Line>` (PV, EV, SPI) | `/api/dashboard/charts/earned-value/:id` |
| Work Item Progress | `<PieChart>` + `<Pie innerRadius={60}>` (donut) | Computed from summary.completed_tasks / summary.total_tasks |
| Project Health | `<PieChart>` + `<Pie>` + `<Cell>` (3 colors) | Computed from summary.total_red/amber/green |

### 3.4 Kanban Board Design

```
+-----------------+-----------------+-----------------+-----------------+
|    TO DO (5)    | WORKING ON IT(8)|    DONE (12)    |    STUCK (2)    |
+-----------------+-----------------+-----------------+-----------------+
| +-------------+ | +-------------+ | +-------------+ | +-------------+ |
| | Task Name   | | | Task Name   | | | Task Name   | | | Task Name   | |
| | Owner: Budi | | | Owner: Sari | | | Owner: Budi | | | Owner: Adi  | |
| | Due: Apr 15 | | | Due: Apr 10 | | | Due: Apr 8  | | | Due: Apr 5  | |
| | [photo] [2] | | | [photo] [1] | | | [photo] [3] | | | [photo] [0] | |
| +-------------+ | +-------------+ | +-------------+ | +-------------+ |
| +-------------+ | +-------------+ | +-------------+ |                 |
| | ...         | | | ...         | | | ...         | |                 |
| +-------------+ | +-------------+ | +-------------+ |                 |
+-----------------+-----------------+-----------------+-----------------+
```

**Implementation approach:** CSS Grid or Flexbox columns. For drag-and-drop, use `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd) or implement simple click-to-move status change. Given thesis scope, **click-to-change-status via dropdown** is simpler and sufficient. Drag-and-drop can be deferred.

### 3.5 Manager Dashboard Layout

```
+------------------------------------------------------------------+
| SUMMARY CARDS                                                     |
| [All Projects: 25] [Active: 18] [On Track: 10] [Warning: 5]     |
| [Critical: 3]     [All Tasks: 150] [Done: 87]  [Stuck: 8]       |
+------------------------------------------------------------------+
| ROW 1: Two charts side by side                                    |
| +-----------------------------+ +-------------------------------+ |
| | Project Health Distribution | | Tasks by Status               | |
| | (Pie: green/amber/red)      | | (Pie: to_do/working/done/stuck| |
| +-----------------------------+ +-------------------------------+ |
+------------------------------------------------------------------+
| ROW 2: Two charts side by side                                    |
| +-----------------------------+ +-------------------------------+ |
| | Tasks by Owner              | | Tasks by Due Date             | |
| | (Horizontal bar)            | | (Stacked bar by month)        | |
| +-----------------------------+ +-------------------------------+ |
+------------------------------------------------------------------+
| ROW 3: Full width                                                 |
| +------------------------------------------------------------+   |
| | Overdue Tasks (bar chart)                                   |   |
| +------------------------------------------------------------+   |
+------------------------------------------------------------------+
| PROJECT LIST (sorted by health: red -> amber -> green)            |
| +------------------------------------------------------------+   |
| | Project cards with health, phase, tasks, client info        |   |
| +------------------------------------------------------------+   |
+------------------------------------------------------------------+
```

### 3.6 TypeScript Types (NEW `types/index.ts`)

```typescript
// === Enums ===
export type UserRole = 'technician' | 'manager' | 'admin';
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled';
export type ProjectPhase = 'survey' | 'execution';
export type HealthStatus = 'green' | 'amber' | 'red';
export type TaskStatus = 'to_do' | 'working_on_it' | 'done' | 'stuck';
export type EvidenceType = 'photo' | 'document' | 'form' | 'screenshot' | 'other';

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
  project_count?: number; // computed in list queries
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  client_id?: number;
  client_name?: string; // joined
  start_date: string;
  end_date: string;
  duration: number;
  status: ProjectStatus;
  phase: ProjectPhase;
  project_value: number;
  survey_approved: boolean;
  target_description?: string;
  created_by: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  project_id: number;
  project_name?: string; // joined
  name: string;
  description?: string;
  assigned_to?: number;
  assigned_to_name?: string; // joined
  status: TaskStatus;
  due_date?: string;
  timeline_start?: string;
  timeline_end?: string;
  notes?: string;
  budget: number;
  sort_order: number;
  is_survey_task: boolean;
  evidence_count?: number; // computed
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

export interface Material {
  id: number;
  project_id: number;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number; // generated
  notes?: string;
}

export interface BudgetItem {
  id: number;
  project_id: number;
  category: string;
  description?: string;
  amount: number;
  is_actual: boolean;
}

export interface DailyReport {
  id: number;
  project_id: number;
  task_id?: number;
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
  total_tasks: number;
  completed_tasks: number;
  working_tasks: number;
  stuck_tasks: number;
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
  stuck_tasks: number;
  overdue_projects: number;
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

export interface ProjectWithDetail extends Project {
  health?: ProjectHealth;
  client?: Client;
  tasks: Task[];
  materials: Material[];
  budget_items: BudgetItem[];
  daily_reports: DailyReport[];
  assigned_technicians: User[];
}

// === Chart Data Types ===
export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface TasksByOwnerData {
  user_id: number;
  name: string;
  total: number;
  done: number;
  working: number;
  stuck: number;
  to_do: number;
}

export interface TasksByDueDateData {
  month: string;
  to_do: number;
  working_on_it: number;
  done: number;
  stuck: number;
}

export interface EarnedValuePoint {
  date: string;
  pv: number;
  ev: number;
  spi: number;
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
```

---

## 4. SPI CALCULATION ENGINE

### 4.1 Revised Formula

**Primary SPI (task-based):**
```
EV (Earned Value) = (completed_tasks / total_tasks) * 100
PV (Planned Value) = (elapsed_days / total_project_days) * 100
SPI = EV / PV
```

Where:
- `completed_tasks` = COUNT of tasks WHERE status = 'done' AND project_id = X
- `total_tasks` = COUNT of tasks WHERE project_id = X (excluding survey tasks if project is in execution phase)
- `elapsed_days` = (today - start_date) in days, clamped to [0, duration]
- `total_project_days` = end_date - start_date

**Edge cases:**
- PV = 0 (project hasn't started yet): SPI = 1.0
- total_tasks = 0 (no tasks created yet): SPI = 1.0 (no data to evaluate)
- All tasks done: EV = 100. If PV < 100, SPI > 1.0 (ahead of schedule)
- Project past end_date: PV clamped to 100. SPI = EV / 100

### 4.2 Health Thresholds (unchanged)

| SPI Range | Status | Color | Meaning |
|-----------|--------|-------|---------|
| SPI >= 0.95 | Green | #06d6a0 | On track |
| 0.85 <= SPI < 0.95 | Amber | #ffd700 | Warning |
| SPI < 0.85 | Red | #ef4444 | Critical (EWS trigger) |

### 4.3 Recalculation Triggers

SPI recalculation happens on:
1. **Task status change** (any status -> done, done -> any other status)
2. **Task created or deleted** (changes total_tasks)
3. **Daily report submitted** (kept for backward compatibility)
4. **Project dates modified** (changes PV calculation)

### 4.4 Revised `spiCalculator.ts` Design

```typescript
// server/src/services/spiCalculator.ts

export function calculatePlannedValue(startDate: Date, endDate: Date, referenceDate?: Date): number {
  // KEEP existing logic -- it is correct
}

export function categorizeHealth(spiValue: number): HealthStatus {
  // KEEP existing logic -- it is correct
}

export async function getTaskCounts(projectId: number): Promise<{
  total: number;
  completed: number;
  working: number;
  stuck: number;
  overdue: number;
}> {
  // NEW: Query task counts by status for a project
  const result = await query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'done') AS completed,
      COUNT(*) FILTER (WHERE status = 'working_on_it') AS working,
      COUNT(*) FILTER (WHERE status = 'stuck') AS stuck,
      COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('done')) AS overdue
    FROM tasks
    WHERE project_id = $1
  `, [projectId]);
  return result.rows[0];
}

export async function recalculateSPI(projectId: number): Promise<ProjectHealth | null> {
  // Get project dates
  const project = await getProject(projectId);
  if (!project) return null;

  // Get task counts
  const taskCounts = await getTaskCounts(projectId);

  // Calculate PV (time-based, keep existing)
  const plannedValue = calculatePlannedValue(project.start_date, project.end_date);

  // Calculate EV (task-based, NEW)
  let actualProgress: number;
  if (taskCounts.total === 0) {
    // Fallback to daily_reports if no tasks exist (backward compat)
    const latestReport = await getLatestReport(projectId);
    actualProgress = latestReport ? latestReport.progress_percentage : 0;
  } else {
    actualProgress = (taskCounts.completed / taskCounts.total) * 100;
  }

  // SPI = EV / PV
  const spiValue = plannedValue > 0 ? actualProgress / plannedValue : 1;
  const deviationPercent = actualProgress - plannedValue;
  const status = categorizeHealth(spiValue);

  // Upsert project_health with task counts
  const health = await upsertProjectHealth(projectId, {
    spi_value: spiValue,
    status,
    deviation_percent: deviationPercent,
    actual_progress: actualProgress,
    planned_progress: plannedValue,
    total_tasks: taskCounts.total,
    completed_tasks: taskCounts.completed,
    working_tasks: taskCounts.working,
    stuck_tasks: taskCounts.stuck,
    overdue_tasks: taskCounts.overdue,
  });

  return health;
}
```

**KEY DESIGN DECISION:** If a project has tasks, SPI comes from task completion ratio. If a project has NO tasks (legacy data), SPI falls back to latest daily_report.progress_percentage. This ensures backward compatibility with existing projects while new projects use the task-based model.

### 4.5 Earned Value Timeline Recording

For the Earned Value chart, we need historical SPI snapshots. Two approaches:

**Option A (recommended): Compute on read.** When the earned value chart endpoint is called, query daily_reports + tasks by date range and compute PV/EV/SPI for each date. No extra storage needed.

**Option B: Snapshot table.** A `spi_history` table records daily snapshots. Requires a cron job or trigger. More complex.

**Decision: Option A.** For thesis scope, computing on read is simpler and sufficient. If performance becomes an issue at scale, add a snapshot table later.

---

## 5. IMPLEMENTATION ORDER

### Phase 1: Schema Migration + Backend Foundation
**Duration estimate: ~2-3 implementation sessions**

```
Step 1.1: Write migration SQL (002_add_rewrite_tables.sql)
  - clients, tasks, task_evidence, materials, budget_items
  - ALTER projects (add columns)
  - ALTER daily_reports (add task_id)
  - ALTER project_health (add task counters)
  - New indexes

Step 1.2: Update backend types (server/src/types/index.ts)
  - Add Client, Task, TaskEvidence, Material, BudgetItem types
  - Update Project, DailyReport, ProjectHealth types
  - Add new enum types

Step 1.3: Rewrite SPI calculator
  - Add getTaskCounts()
  - Modify recalculateSPI() to use task completion ratio
  - Keep fallback to daily_reports for legacy projects
  - Unit test with known scenarios

Step 1.4: New route files
  - server/src/routes/clients.ts (CRUD)
  - server/src/routes/tasks.ts (CRUD + status change + bulk create)
  - server/src/routes/evidence.ts (upload + list + download + delete)
  - server/src/routes/materials.ts (CRUD)
  - server/src/routes/budget.ts (CRUD)

Step 1.5: Modify existing routes
  - projects.ts: Add client_id, project_value, phase, survey approval endpoints
  - dashboard.ts: Add chart data endpoints, technician dashboard
  - dailyReports.ts: Accept optional task_id
  - users.ts: Include task counts in my-projects

Step 1.6: File upload infrastructure
  - Install multer
  - Configure disk storage to server/uploads/
  - Add static file serving with auth
  - Create uploads directory structure

Step 1.7: Register all new routes in app.ts
  - Mount /api/clients, /api/tasks, /api/evidence, /api/materials, /api/budget
  - Add express.static for uploads
```

### Phase 2: Frontend Foundation
**Duration estimate: ~2-3 implementation sessions**

```
Step 2.1: Update frontend types (frontend/src/types/index.ts)
  - Complete rewrite with all new types (see Section 3.6)

Step 2.2: Expand API service (frontend/src/services/api.ts)
  - Add all new API functions for clients, tasks, evidence, materials, budget, charts

Step 2.3: Create new hooks
  - useProjects.ts (extract from useDashboard, expand)
  - useTasks.ts (task CRUD, status change, bulk create)
  - useClients.ts (client CRUD)
  - useEvidence.ts (upload, list, delete)
  - useMaterials.ts (CRUD)
  - useBudget.ts (CRUD)

Step 2.4: Update useDashboard.ts
  - Add chart data query hooks
  - Add technician dashboard hook
  - Expand summary types

Step 2.5: Build shared UI components
  - FileUpload.tsx (drag-and-drop with preview)
  - Modal.tsx (reusable modal)
  - DataTable.tsx (sortable, filterable table)
  - EmptyState.tsx
  - ConfirmDialog.tsx
```

### Phase 3: Frontend Pages -- Manager Views
**Duration estimate: ~2-3 implementation sessions**

```
Step 3.1: Manager Dashboard (REBUILD DashboardPage)
  - Summary cards (expanded with task counts)
  - 8 chart components using Recharts
  - Project list sorted by health

Step 3.2: Project List Page (REBUILD ProjectsPage)
  - Table with: name, client, phase, health, task progress, dates, value
  - Search + filter controls
  - Link to project detail

Step 3.3: Project Detail Page (REBUILD ProjectDetailPage)
  - Header: project info, health badge, phase indicator
  - Tab layout: Tasks | Budget | Materials | Reports | Evidence
  - Survey approval controls (when in survey phase)
  - Assignment management
  - Earned value chart

Step 3.4: Create Project Page (REBUILD CreateProjectForm -> full page)
  - Multi-step form: Client selection -> Project details -> Initial tasks -> Review
  - Or single-page form with sections

Step 3.5: Client Management
  - ClientListPage: table with project count
  - CreateClientPage: simple form

Step 3.6: Chart Components (all NEW)
  - TasksByStatusChart, TasksByOwnerChart, OverdueTasksChart
  - TasksByDueDateChart, BudgetStatusChart, EarnedValueChart
  - WorkItemProgressChart, ProjectHealthPieChart
```

### Phase 4: Frontend Pages -- Technician Views
**Duration estimate: ~1-2 implementation sessions**

```
Step 4.1: Technician Dashboard (NEW)
  - My task summary cards
  - Assigned projects list
  - Recent tasks

Step 4.2: Technician Tasks Page (NEW)
  - Kanban board (4 columns by status)
  - Table view toggle
  - Task status change
  - Evidence upload per task

Step 4.3: Task Detail Page (NEW)
  - Task info, status, assignment
  - Evidence gallery
  - Status change action

Step 4.4: Update Layout/Navigation
  - Add sidebar or expanded top nav
  - Role-based menu items
  - Active route highlighting
```

### Phase 5: Integration + Polish
**Duration estimate: ~1 implementation session**

```
Step 5.1: Update App.tsx routing (all new routes)
Step 5.2: Update seed.sql (new sample data with tasks, clients, etc.)
Step 5.3: Test SPI recalculation end-to-end
Step 5.4: Test file upload flow
Step 5.5: Test survey approval workflow
Step 5.6: Responsive design check
Step 5.7: Error handling + loading states
```

### Dependency Graph

```
Schema Migration (1.1)
  └──> Backend Types (1.2)
       └──> SPI Calculator (1.3)
       └──> New Routes (1.4, 1.5)
            └──> File Upload (1.6)
            └──> Route Registration (1.7)
                 └──> Frontend Types (2.1)
                      └──> API Service (2.2)
                           └──> Hooks (2.3, 2.4)
                                └──> UI Components (2.5)
                                     └──> Manager Pages (3.1-3.6) [parallel]
                                     └──> Technician Pages (4.1-4.4) [parallel]
                                          └──> Integration (5.1-5.7)
```

Manager pages and Technician pages can be built IN PARALLEL by different agents.

---

## 6. KEEP vs REBUILD MATRIX

### 6.1 Files to KEEP AS-IS (no changes)

| File | Reason |
|------|--------|
| `server/src/middleware/auth.ts` | JWT auth + role authorization is clean and correct |
| `server/src/utils/db.ts` | pg Pool wrapper works fine |
| `server/.env.example` | Environment config template |
| `server/tsconfig.json` | TypeScript config is fine |
| `frontend/src/main.tsx` | Entry point, no changes needed |
| `frontend/src/index.css` | Tailwind import, no changes |
| `frontend/src/hooks/useAuth.ts` | Auth state management is solid |
| `frontend/src/pages/LandingPage.tsx` | Company landing page, separate concern |
| `frontend/src/pages/LoginPage.tsx` | Login form works, minor style tweaks only |
| `frontend/src/components/ui/StatusBadge.tsx` | RAG badge is reusable |
| `frontend/src/components/ui/ProgressBar.tsx` | Dual bar works for progress display |
| `frontend/vite.config.ts` | Proxy config is correct |
| `frontend/postcss.config.js` | Tailwind config is correct |
| `frontend/tsconfig.json` | TypeScript config is fine |
| `frontend/tsconfig.node.json` | Node config is fine |
| `frontend/index.html` | SPA entry, no changes |

### 6.2 Files to MODIFY (keep structure, change content)

| File | Changes |
|------|---------|
| `server/database/schema.sql` | Add new tables (clients, tasks, task_evidence, materials, budget_items), modify projects/daily_reports/project_health tables. Write as migration, keep original as reference. |
| `server/database/seed.sql` | Complete rewrite with sample data including clients, tasks, materials, budget items, evidence records |
| `server/src/app.ts` | Add new route mounts (/api/clients, /api/tasks, /api/evidence, /api/materials, /api/budget), add express.static for uploads, add multer |
| `server/src/types/index.ts` | Expand with Client, Task, TaskEvidence, Material, BudgetItem, ProjectPhase, TaskStatus, EvidenceType types. Keep existing types, add new ones. |
| `server/src/services/spiCalculator.ts` | Change EV source from daily_reports to task completion ratio. Keep calculatePlannedValue and categorizeHealth. Add getTaskCounts. Modify recalculateSPI. |
| `server/src/routes/projects.ts` | Add client_id, project_value, phase to create/update. Add survey approval endpoints. Expand GET response with task counts. |
| `server/src/routes/dashboard.ts` | Add chart data endpoints. Add technician dashboard. Expand summary with task counts. |
| `server/src/routes/dailyReports.ts` | Accept optional task_id in POST body |
| `server/src/routes/users.ts` | Include task counts in my-projects response |
| `server/src/routes/auth.ts` | Add protection on register (only admin can create managers) |
| `server/package.json` | Add `multer` and `@types/multer` dependencies |
| `frontend/src/App.tsx` | Add all new routes, update role-based routing |
| `frontend/src/types/index.ts` | Complete rewrite (see Section 3.6) |
| `frontend/src/services/api.ts` | Add all new API functions (clients, tasks, evidence, materials, budget, charts) |
| `frontend/src/hooks/useDashboard.ts` | Add chart data hooks, expand summary types, add technician dashboard hook |
| `frontend/src/components/ui/Layout.tsx` | Add sidebar or expand top nav with new menu items (Clients, Tasks) |
| `frontend/src/components/dashboard/SummaryCards.tsx` | Add task-based KPI cards (total tasks, done, stuck) |
| `frontend/src/components/dashboard/ProjectCard.tsx` | Add phase indicator, task progress, client name |
| `frontend/src/components/dashboard/ProjectHealthGrid.tsx` | Add filter by phase, add task info display |
| `frontend/package.json` | Add `@hello-pangea/dnd` for Kanban drag-and-drop (optional) |

### 6.3 Files to DELETE

| File | Reason |
|------|--------|
| `frontend/src/components/forms/CreateProjectForm.tsx` | Replaced by `pages/projects/CreateProjectPage.tsx` (full page form) |
| `frontend/src/components/forms/DailyReportForm.tsx` | Move to `components/forms/` but significantly rebuild. Actually KEEP file but REBUILD content. |

**Note:** Very few files are deleted. Most are modified or replaced with new versions. The old `CreateProjectForm` is too simple for the new requirements (it lacks client, budget, value, materials fields) and becomes a full page.

### 6.4 Files to CREATE

#### Backend (NEW files):

| File | Purpose |
|------|---------|
| `server/database/migrations/002_add_rewrite_tables.sql` | Additive migration for all new tables and columns |
| `server/src/routes/clients.ts` | Client CRUD (5 endpoints) |
| `server/src/routes/tasks.ts` | Task CRUD + status + reorder + bulk (8 endpoints) |
| `server/src/routes/evidence.ts` | File upload + list + download + delete (4 endpoints) |
| `server/src/routes/materials.ts` | Material CRUD (4 endpoints) |
| `server/src/routes/budget.ts` | Budget CRUD (4 endpoints) |
| `server/uploads/.gitkeep` | Upload directory placeholder |

#### Frontend (NEW files):

| File | Purpose |
|------|---------|
| `frontend/src/hooks/useProjects.ts` | Project CRUD hooks (extracted from useDashboard) |
| `frontend/src/hooks/useTasks.ts` | Task CRUD + status change hooks |
| `frontend/src/hooks/useClients.ts` | Client CRUD hooks |
| `frontend/src/hooks/useEvidence.ts` | File upload hooks |
| `frontend/src/hooks/useMaterials.ts` | Material CRUD hooks |
| `frontend/src/hooks/useBudget.ts` | Budget CRUD hooks |
| `frontend/src/pages/dashboard/ManagerDashboard.tsx` | Charts + summary (replaces DashboardPage) |
| `frontend/src/pages/dashboard/TechnicianDashboard.tsx` | My tasks summary |
| `frontend/src/pages/projects/ProjectListPage.tsx` | Rich table view (replaces ProjectsPage) |
| `frontend/src/pages/projects/ProjectDetailPage.tsx` | Full detail with tabs (replaces old ProjectDetailPage) |
| `frontend/src/pages/projects/CreateProjectPage.tsx` | Rich form (replaces CreateProjectForm) |
| `frontend/src/pages/projects/ProjectTasksPage.tsx` | Task management for a project |
| `frontend/src/pages/tasks/TechnicianTasksPage.tsx` | Kanban + table for technician |
| `frontend/src/pages/tasks/TaskDetailPage.tsx` | Single task detail |
| `frontend/src/pages/clients/ClientListPage.tsx` | Client table |
| `frontend/src/pages/clients/CreateClientPage.tsx` | Client form |
| `frontend/src/components/charts/TasksByStatusChart.tsx` | Pie chart |
| `frontend/src/components/charts/TasksByOwnerChart.tsx` | Bar chart |
| `frontend/src/components/charts/OverdueTasksChart.tsx` | Bar chart |
| `frontend/src/components/charts/TasksByDueDateChart.tsx` | Stacked bar chart |
| `frontend/src/components/charts/BudgetStatusChart.tsx` | Bar chart |
| `frontend/src/components/charts/EarnedValueChart.tsx` | Line chart |
| `frontend/src/components/charts/WorkItemProgressChart.tsx` | Donut chart |
| `frontend/src/components/charts/ProjectHealthPieChart.tsx` | Pie chart |
| `frontend/src/components/tasks/KanbanBoard.tsx` | Kanban columns layout |
| `frontend/src/components/tasks/KanbanCard.tsx` | Individual kanban card |
| `frontend/src/components/tasks/TaskTable.tsx` | Task table view |
| `frontend/src/components/tasks/TaskRow.tsx` | Single task row |
| `frontend/src/components/tasks/TaskStatusSelect.tsx` | Status dropdown |
| `frontend/src/components/tasks/TaskForm.tsx` | Create/edit task form |
| `frontend/src/components/projects/ProjectForm.tsx` | Rich project form |
| `frontend/src/components/projects/SurveyApproval.tsx` | Survey review UI |
| `frontend/src/components/projects/MaterialsList.tsx` | Materials table |
| `frontend/src/components/projects/BudgetTable.tsx` | Budget items table |
| `frontend/src/components/evidence/EvidenceGallery.tsx` | File grid with preview |
| `frontend/src/components/evidence/EvidenceUploader.tsx` | Upload UI |
| `frontend/src/components/ui/FileUpload.tsx` | Generic file upload |
| `frontend/src/components/ui/Modal.tsx` | Reusable modal |
| `frontend/src/components/ui/DataTable.tsx` | Reusable sortable table |
| `frontend/src/components/ui/EmptyState.tsx` | Empty state |
| `frontend/src/components/ui/ConfirmDialog.tsx` | Confirm dialog |

### 6.5 Summary Counts

| Action | Backend Files | Frontend Files | Total |
|--------|---------------|----------------|-------|
| KEEP | 4 | 11 | 15 |
| MODIFY | 10 | 9 | 19 |
| DELETE | 0 | 1 | 1 |
| CREATE | 7 | 39 | 46 |
| **TOTAL** | **21** | **60** | **81** |

---

## APPENDIX: VALIDATION CONCERNS FOR ITO/SUZUKI/WATANABE

### Security (Ito)
1. Registration endpoint allows anyone to register as manager -- needs protection
2. File upload needs: type whitelist, size limit (10MB), filename sanitization, path traversal prevention
3. JWT has no expiration set (line 37 of auth.ts) -- should add `expiresIn`
4. File serving needs auth middleware (uploads/ should not be publicly accessible)
5. Survey approval needs to verify approver is the project's manager/admin

### Quality (Suzuki)
1. SPI calculator needs unit tests for: zero tasks, all done, overdue, edge cases
2. Task status transitions need validation (prevent invalid transitions)
3. Auto-assign algorithm needs edge case handling (0 tasks, 0 technicians, uneven distribution)
4. File upload needs cleanup on task deletion (cascade to filesystem, not just DB)
5. Budget calculations need precision handling (DECIMAL vs float)

### Build (Watanabe)
1. multer dependency needs adding to package.json
2. Migration SQL must be idempotent (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS)
3. uploads/ directory needs .gitignore entry
4. Frontend needs environment variable for upload file size limit
5. Consider adding express-rate-limit on upload endpoint
