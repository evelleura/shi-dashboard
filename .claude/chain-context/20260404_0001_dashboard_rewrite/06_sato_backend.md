---
task_id: "20260404_0001_dashboard_rewrite"
agent: "sato"
phase: "implementation"
status: "COMPLETE"
timestamp: "2026-04-04T04:00:00Z"
---

# Context: Sato Kenji - Backend Implementation

## Work Done

### 1. Database Schema Migration
**File:** `server/database/migration.sql`
- Additive migration wrapped in transaction (BEGIN/COMMIT)
- All operations idempotent (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS)
- New tables: clients, tasks, task_evidence, materials, budget_items
- Modified tables: projects (7 new columns + 3 constraints), daily_reports (task_id), project_health (5 task counter columns)
- All foreign keys, indexes, and CHECK constraints
- Existing data migration: sets all existing projects to phase='execution', survey_approved=TRUE

### 2. Complete Schema (Fresh Install)
**File:** `server/database/schema.sql`
- Full rewrite with all 9 tables
- Complete constraint definitions
- All indexes
- Admin seed user preserved

### 3. Seed Data
**File:** `server/database/seed.sql`
- 5 users (1 admin, 1 manager, 3 technicians)
- 5 clients with realistic Indonesian business data
- 5 projects with client references, phases, project values
- 32 tasks across all projects (varied status distribution for dashboard testing)
- Materials for 2 projects (9 items)
- Budget items for 2 projects (planned and actual)
- Daily reports preserved from original (backward compat testing)
- Task distribution designed to produce: Red (Citra Raya), Green (BPD DIY), Red (Villa Kaliurang), Amber (Gudang Logistik), Survey (Hotel Melia)

### 4. TypeScript Types
**File:** `server/src/types/index.ts`
- All entity interfaces: User, AuthUser, Client, Project, Task, TaskEvidence, Material, BudgetItem, DailyReport, ProjectHealth
- Composite types: ProjectWithHealth, DashboardProject, ProjectWithDetail
- Dashboard types: DashboardSummary
- Chart data types: TasksByStatusData, TasksByOwnerData, TasksByDueDateData, OverdueTasksData, BudgetStatusData, EarnedValuePoint
- Enum types: UserRole, ProjectStatus, ProjectPhase, HealthStatus, TaskStatus, EvidenceType
- API types: JwtPayload, ApiResponse, LoginResponse

### 5. SPI Calculator Rewrite
**File:** `server/src/services/spiCalculator.ts`
- Kept: calculatePlannedValue() (unchanged, correct)
- Kept: categorizeHealth() (unchanged, correct)
- New: getTaskCounts() -- queries task count breakdown using PostgreSQL FILTER aggregate
- Rewritten: recalculateSPI() -- primary source is task completion ratio (completed/total * 100), fallback to daily_reports.progress_percentage when no tasks exist
- Kept: recalculateAllActiveSPI() (unchanged)
- Edge cases handled: PV=0, total_tasks=0, all done, overdue

### 6. New Routes (5 files)

**clients.ts** (5 endpoints):
- GET / -- List all with project count
- GET /:id -- Single with projects
- POST / -- Create (name validation)
- PATCH /:id -- Update
- DELETE /:id -- Admin only

**tasks.ts** (8 endpoints):
- GET /project/:projectId -- List tasks (tech sees assigned only)
- GET /:id -- Single with evidence
- POST / -- Create (auto sort_order)
- POST /bulk -- Bulk create in transaction
- PATCH /:id -- Full update (manager only)
- PATCH /:id/status -- Status change with transition rules (tech: enforced transitions, manager: any valid status)
- POST /:id/reorder -- Change sort_order
- DELETE /:id -- Delete with SPI recalc

**evidence.ts** (4 endpoints):
- POST /upload -- Multer disk storage, 10MB limit, type whitelist (images, PDF, Word, Excel), sanitized filenames
- GET /task/:taskId -- List evidence
- GET /:id/download -- Download file
- DELETE /:id -- Delete from DB + disk

**materials.ts** (4 endpoints):
- GET /project/:projectId -- List with totals
- POST / -- Create with validation
- PATCH /:id -- Update
- DELETE /:id -- Delete

**budget.ts** (4 endpoints):
- GET /project/:projectId -- List with planned/actual summary and by-category breakdown
- POST / -- Create
- PATCH /:id -- Update
- DELETE /:id -- Delete

### 7. Modified Routes (3 files)

**projects.ts** (11 endpoints, 5 new):
- Expanded GET / and GET /:id with client info, task counts, phase, project_value
- Expanded POST / with client_id, project_value, target_description, phase
- Expanded PATCH /:id with all new fields + date re-validation
- New: DELETE /:id (admin only)
- New: DELETE /:id/assignments/:userId (unassign)
- New: POST /:id/auto-assign (round-robin task distribution in transaction)
- New: POST /:id/approve-survey (phase transition survey -> execution)
- New: POST /:id/reject-survey (reset survey tasks to to_do)

**dashboard.ts** (8 endpoints, 7 new):
- Expanded GET / with task stats, client info, recent activity (tasks + reports)
- New: GET /charts/tasks-by-status (pie chart)
- New: GET /charts/tasks-by-owner (bar chart)
- New: GET /charts/overdue-tasks (bar chart)
- New: GET /charts/tasks-by-due-date (stacked bar by month)
- New: GET /charts/budget-status (planned vs actual)
- New: GET /charts/earned-value/:projectId (weekly PV/EV/SPI timeline, computed on read)
- New: GET /technician (technician-specific dashboard)

**dailyReports.ts** (2 endpoints, 1 modified):
- POST / now accepts optional task_id with validation
- GET / now includes task_name in join

### 8. Updated Routes (1 file)

**users.ts**:
- GET /me/projects now includes task counts (my_task_count, my_completed, my_working, my_stuck, my_overdue)

### 9. Infrastructure

**app.ts**:
- 5 new route registrations (/api/clients, /api/tasks, /api/evidence, /api/materials, /api/budget)
- Uploads directory creation on startup
- Static file serving for /uploads

**package.json**:
- Added multer ^1.4.5-lts.1
- Added @types/multer ^1.4.12

**.gitignore**:
- Added server/uploads/* exclusion with .gitkeep exception

## Verification

- TypeScript compilation: ZERO errors (npx tsc --noEmit passes clean)
- npm install: Success, all dependencies resolved
- All route files import correctly
- All types are consistent between schema.sql, types/index.ts, and route queries

## Design Decisions Made

1. **Task status transitions enforced for technicians only.** Managers can set any valid status (override). This prevents technicians from skipping steps while giving managers flexibility.

2. **Evidence upload uses multer disk storage.** Files saved to server/uploads/projects/{pid}/tasks/{tid}/{timestamp}_{filename}. Filenames sanitized (alphanumeric + dash + underscore only).

3. **Earned value chart computed on read.** Weekly data points from project start to today. Uses task completion for EV when tasks exist, falls back to daily_reports for legacy projects.

4. **Auto-assign uses round-robin.** Distributes unassigned tasks evenly across specified technicians in sort_order sequence. Wrapped in transaction.

5. **Budget summary computed on read.** Planned vs actual totals and per-category breakdown computed at query time. No denormalized columns needed.

6. **SPI recalculation triggers:** task create, task delete, task status change, daily report submit, project dates change.

## Files Changed (all absolute paths)

### Created
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\database\migration.sql
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\clients.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\tasks.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\evidence.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\materials.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\budget.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\uploads\.gitkeep

### Modified
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\database\schema.sql
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\database\seed.sql
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\types\index.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\services\spiCalculator.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\projects.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\dashboard.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\dailyReports.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\routes\users.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\src\app.ts
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\server\package.json
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\.gitignore

## Endpoint Count Summary

| Resource | Endpoints | New | Modified | Kept |
|----------|-----------|-----|----------|------|
| Auth | 2 | 0 | 0 | 2 |
| Users | 4 | 0 | 1 | 3 |
| Clients | 5 | 5 | 0 | 0 |
| Projects | 11 | 5 | 3 | 3 |
| Tasks | 8 | 8 | 0 | 0 |
| Evidence | 4 | 4 | 0 | 0 |
| Dashboard | 8 | 7 | 1 | 0 |
| Reports | 2 | 0 | 1 | 1 |
| Materials | 4 | 4 | 0 | 0 |
| Budget | 4 | 4 | 0 | 0 |
| **TOTAL** | **52** | **37** | **6** | **9** |

## Next Steps
- Frontend rewrite (Takahashi-san's domain)
- After seed data is loaded, run recalculateAllActiveSPI() to populate project_health
