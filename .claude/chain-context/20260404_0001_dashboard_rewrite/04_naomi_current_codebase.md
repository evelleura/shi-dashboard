---
task_id: "20260404_0001_dashboard_rewrite"
agent: "naomi"
phase: "exploration"
status: "COMPLETE"
timestamp: "2026-04-04T02:15:00Z"
---

# Exploration Report: Current Codebase Analysis

## FILE INVENTORY

### Backend (server/) -- 17 files total
```
server/
  .env.example                    # DB + JWT config
  package.json                    # Express 5.2.1, pg 8.20, bcryptjs, jsonwebtoken
  tsconfig.json                   # ES2020, commonjs, strict
  database/
    schema.sql                    # 5 tables, constraints, indexes
    seed.sql                      # 5 users, 5 projects, 3 assignments, ~9 reports
    setup.ts                      # Raw SQL runner via pg Pool
  src/
    app.ts                        # Express entry, 5 route mounts, health check
    middleware/auth.ts             # JWT authenticate + role authorize
    routes/auth.ts                # POST login + register
    routes/projects.ts            # CRUD + assignments (6 endpoints)
    routes/dailyReports.ts        # POST submit + GET list (2 endpoints)
    routes/dashboard.ts           # GET aggregated (1 endpoint, manager-only)
    routes/users.ts               # me, list, technicians, my-projects (4 endpoints)
    services/spiCalculator.ts     # PV calc, SPI calc, health categorize, upsert
    types/index.ts                # 11 type definitions
    utils/db.ts                   # pg Pool wrapper, query helper
```

### Frontend (frontend/) -- 28 files total
```
frontend/
  index.html                      # SPA entry
  package.json                    # React 19.2, TanStack Query 5.90, recharts 3.8, axios
  vite.config.ts                  # Proxy /api -> localhost:3000
  postcss.config.js               # Tailwind v4 + autoprefixer
  tsconfig.json                   # ES2020, strict, react-jsx
  tsconfig.node.json
  src/
    main.tsx                      # StrictMode + root render
    App.tsx                       # Router + ProtectedRoute + QueryClientProvider
    index.css                     # @import "tailwindcss" (single line)
    types/index.ts                # 13 type/interface definitions
    services/api.ts               # Axios instance, 13 API functions, JWT interceptor
    hooks/useAuth.ts              # login/register/logout + localStorage
    hooks/useDashboard.ts         # 8 TanStack Query hooks + 3 mutations
    pages/
      LandingPage.tsx             # 871 lines -- company landing (hero, IoT, services, gallery, testimonials, contact, footer)
      LoginPage.tsx               # 97 lines -- email/password form
      DashboardPage.tsx           # 118 lines -- summary cards + project grid + recent reports
      ProjectDetailPage.tsx       # 151 lines -- SPI metrics + progress chart + report timeline
      ProjectsPage.tsx            # 109 lines -- table view with search + create form
      ReportPage.tsx              # 44 lines -- technician report form + recent reports
    components/
      dashboard/
        ProjectCard.tsx           # 80 lines -- card with health border, SPI, deviation, progress bar
        ProjectHealthGrid.tsx     # 31 lines -- filtered grid of ProjectCards
        SummaryCards.tsx           # 33 lines -- 6 summary metric cards
      forms/
        CreateProjectForm.tsx     # 114 lines -- name, desc, start/end date
        DailyReportForm.tsx       # 134 lines -- project select, date, progress %, constraints
      ui/
        Layout.tsx                # 73 lines -- top nav bar + content wrapper
        ProgressBar.tsx           # 47 lines -- dual bar (actual vs planned)
        StatusBadge.tsx           # 32 lines -- RAG colored badge
```

---

## BACKEND ANALYSIS

### Database Schema (5 tables)

| Table | Columns | Constraints | Notes |
|-------|---------|-------------|-------|
| users | 6 cols (id, name, email, role, password_hash, created_at) | role CHECK (technician/manager/admin), email UNIQUE | Solid |
| projects | 8 cols (id, name, desc, start/end date, duration GENERATED, status, created_by) | status CHECK, FK to users | Duration auto-computed |
| project_assignments | 3 cols (project_id, user_id, assigned_at) | Composite PK, CASCADE deletes | Many-to-many |
| daily_reports | 7 cols (id, project_id, report_date, progress_percentage, constraints, created_by, created_at) | UNIQUE(project_id, report_date, created_by), progress 0-100, index on project+date | One report per tech per project per day |
| project_health | 7 cols (project_id PK, spi_value, status, deviation_percent, actual_progress, planned_progress, last_updated) | health status CHECK (green/amber/red), FK CASCADE | Denormalized for dashboard speed |

### API Routes (13 endpoints)

| Route | Method | Auth | Role | Purpose |
|-------|--------|------|------|---------|
| /api/auth/login | POST | None | All | JWT login |
| /api/auth/register | POST | None | All | Registration (admin registration NOT locked down) |
| /api/projects | GET | JWT | All | List projects + health + latest report (LATERAL join) |
| /api/projects/:id | GET | JWT | All | Project detail + all reports |
| /api/projects | POST | JWT | manager/admin | Create project |
| /api/projects/:id | PATCH | JWT | manager/admin | Update name/desc/status |
| /api/projects/:id/assignments | GET | JWT | manager/admin | List assigned technicians |
| /api/projects/:id/assignments | POST | JWT | manager/admin | Assign technician |
| /api/daily-reports | POST | JWT | technician/admin | Submit report (upsert, checks assignment) |
| /api/daily-reports | GET | JWT | All (scoped) | List reports (tech sees own, manager sees all) |
| /api/dashboard | GET | JWT | manager/admin | Aggregated dashboard (projects + summary + recent) |
| /api/users/me | GET | JWT | All | Current user info |
| /api/users | GET | JWT | manager/admin | All users list |
| /api/users/technicians | GET | JWT | manager/admin | Technician list |
| /api/users/me/projects | GET | JWT | technician | Assigned active projects |

### SPI Calculator (spiCalculator.ts)

```
PV = (elapsed_days / total_duration) * 100  (clamped to project date range)
EV = latest daily_report.progress_percentage
SPI = EV / PV  (1.0 if PV=0)
Health: green >= 0.95, amber >= 0.85, red < 0.85
```

- Recalculates on report submit + project create
- Upserts into project_health table
- Has `recalculateAllActiveSPI()` for batch (not exposed via API)
- Logic is CORRECT per thesis spec

### Backend Dependencies
```json
{
  "bcryptjs": "^3.0.3",        // Password hashing
  "cors": "^2.8.6",            // CORS middleware
  "dotenv": "^17.3.1",         // Env config
  "express": "^5.2.1",         // Express 5 (latest)
  "jsonwebtoken": "^9.0.3",    // JWT auth
  "pg": "^8.20.0"              // PostgreSQL driver
}
```

---

## FRONTEND ANALYSIS

### Architecture

- **Router:** react-router-dom v7 with ProtectedRoute wrapper
- **State:** TanStack Query for server state, localStorage for auth
- **API:** Axios instance with JWT interceptor + 401 redirect
- **Styling:** Tailwind CSS v4 (PostCSS plugin)
- **Charts:** Recharts (only LineChart used, in ProjectDetailPage)

### Pages

| Page | Lines | What it does | Quality |
|------|-------|-------------|---------|
| LandingPage | 871 | Company marketing page (Hero, IoT, Services, Gallery, Testimonials, Contact, Footer) | MASSIVE monolith file, but well-structured with sections. Not relevant to dashboard rewrite. |
| LoginPage | 97 | Email + password login form | Clean, functional |
| DashboardPage | 118 | Summary cards + filter buttons + ProjectHealthGrid + recent reports list | Good structure, manager-only |
| ProjectDetailPage | 151 | SPI metrics cards + ProgressBar + LineChart (planned vs actual) + report timeline | Best page, has actual charts |
| ProjectsPage | 109 | Table view with search + create form toggle | Clean, functional |
| ReportPage | 44 | DailyReportForm + recent reports list | Minimal, technician-only |

### Components

| Component | Lines | Quality | Notes |
|-----------|-------|---------|-------|
| ProjectCard | 80 | Good | RAG border color, SPI, deviation, progress bar, constraints |
| ProjectHealthGrid | 31 | Good | Simple filter + grid layout |
| SummaryCards | 33 | Good | 6 metric cards (active, red, amber, green, no-report, avg SPI) |
| CreateProjectForm | 114 | Good | Validated form, TanStack mutation |
| DailyReportForm | 134 | Good | Project dropdown (from assignments), date, progress %, constraints |
| Layout | 73 | Good | Top nav with role-based menu items |
| ProgressBar | 47 | Good | Dual bar showing actual vs planned |
| StatusBadge | 32 | Good | RAG badge with dot + label |

### Frontend Dependencies
```json
{
  "@tanstack/react-query": "^5.90.21",  // Server state
  "axios": "^1.13.6",                    // HTTP client
  "react": "^19.2.4",                    // React 19
  "react-dom": "^19.2.4",
  "react-router-dom": "^7.13.1",         // Router v7
  "recharts": "^3.8.0"                   // Charts
}
```

---

## USER STORIES vs CURRENT CODEBASE -- GAP ANALYSIS

The user stories document (docs/user-story/user-stories.md) and mockup images reveal the ACTUAL requirements. The current codebase was built around the THESIS spec (SPI-only dashboard). The user stories describe a much richer system.

### WHAT USER STORIES REQUIRE (but current code LACKS):

#### 1. TASK-LEVEL MANAGEMENT (MASSIVE GAP)
User stories say: "tiap proyek terdiri dari rincian proyek, rincian task"
- Projects should have TASKS (individual work items)
- Each task has: owner, status (Working on it/Done/Stuck), due date, timeline, budget, notes
- Task completion drives project progress (not manual % entry)
- Tasks need Kanban AND Table views
- Tasks can be assigned to specific technicians per task

**Current:** No task table exists. Progress is a single manual percentage per daily report. No Kanban view. No task-level granularity.

#### 2. BUDGET & FINANCIAL TRACKING (COMPLETELY MISSING)
User stories say: "rancangan anggaran", "menentukan nilai proyek dalam rupiah", Budget column in mockups
- Each task has a budget amount
- Project total budget is sum of task budgets
- Budget Status chart needed (bar chart, planned vs actual)
- Project value in Rupiah

**Current:** Zero budget/financial fields anywhere in schema or UI.

#### 3. EVIDENCE/PROOF UPLOAD (COMPLETELY MISSING)
User stories say: "upload bukti foto, dokumen, form etc, screenshot chat"
- Technicians upload proof per task completion
- File/image upload capability
- Evidence storage and viewing

**Current:** Only text "constraints" field on daily reports. No file upload.

#### 4. CLIENT MANAGEMENT (COMPLETELY MISSING)
User stories say: "menerima client, nama, alamat, nomor telepon, call detail"
- Client entity with contact info
- Projects linked to clients
- Manager creates project FROM client needs

**Current:** No client table. Projects have no client reference.

#### 5. SURVEY PHASE (COMPLETELY MISSING)
User stories say: "setiap proyek di awali dengan survei"
- Projects start with a survey phase
- Survey must be approved before work begins
- Technician submits proof of survey completion
- Approval gate between survey and execution

**Current:** No survey concept. Projects go straight to "active".

#### 6. ITEM/MATERIAL TRACKING (COMPLETELY MISSING)
User stories say: "barang yang di indent", "kebutuhan alat"
- Material/equipment list per project
- Indent (requisition) tracking

**Current:** No material/equipment tables or tracking.

#### 7. DASHBOARD CHARTS (MAJOR GAP)
Mockup images show (Monday.com + Zoho style):
- Tasks by Status (pie chart)
- Tasks by Owner (bar chart)
- Overdue Tasks (bar chart)
- Tasks by Due Date (stacked bar chart)
- Work Item Progress (donut chart)
- Milestone Status (pie chart)
- Budget Status (bar chart)
- Issue Status (pie chart)
- Earned Value Analysis chart

**Current:** Only 1 chart exists (LineChart of planned vs actual in ProjectDetailPage). Summary cards show counts only. No pie charts, no bar charts, no donut charts on dashboard.

#### 8. AUTO-ASSIGN (MISSING)
User stories say: "tombol otomatis utk auto assign"
- Manager can auto-assign technicians to tasks

**Current:** Manual assignment only (POST to /assignments).

#### 9. KANBAN VIEW (MISSING)
Mockup image-2.png shows Monday.com card view:
- Tasks displayed as cards
- Status visible on each card
- Owner, due date per card

**Current:** Only table view (ProjectsPage) and card grid (ProjectHealthGrid). No Kanban board.

---

## ASSESSMENT: KEEP / MODIFY / REBUILD

### KEEP (well-built, reusable as-is or near as-is)

| Item | Path | Why Keep |
|------|------|----------|
| SPI Calculator core logic | server/src/services/spiCalculator.ts | `calculatePlannedValue()` and `categorizeHealth()` are correct per thesis. Will need to change what feeds EV (tasks instead of manual %). |
| Auth middleware | server/src/middleware/auth.ts | JWT authenticate + role authorize pattern is clean and correct. |
| DB utility | server/src/utils/db.ts | pg Pool wrapper is clean, connection pooling configured. |
| Type definitions pattern | server/src/types/index.ts | Pattern is good, but types will expand massively. |
| Frontend auth hook | frontend/src/hooks/useAuth.ts | Login/logout/localStorage pattern is solid. |
| API service pattern | frontend/src/services/api.ts | Axios instance + interceptors pattern is reusable. Functions will change. |
| TanStack Query pattern | frontend/src/hooks/useDashboard.ts | Hook pattern with query keys, staleTime, invalidation is well-structured. |
| StatusBadge component | frontend/src/components/ui/StatusBadge.tsx | RAG badge is reusable as-is. |
| ProgressBar component | frontend/src/components/ui/ProgressBar.tsx | Dual bar concept is reusable. |
| Login page | frontend/src/pages/LoginPage.tsx | Clean, functional, minor visual tweaks only. |
| Layout component | frontend/src/components/ui/Layout.tsx | Nav structure good, will need more menu items. |
| Landing page | frontend/src/pages/LandingPage.tsx | Company marketing page, separate from dashboard. Keep as-is. |

### MODIFY (structure good, needs significant feature additions)

| Item | Path | What Changes |
|------|------|-------------|
| Database schema | server/database/schema.sql | KEEP: users, projects (add client_id, project_value_rupiah), project_assignments, project_health. ADD: clients, tasks, task_evidence, materials, survey_approvals tables. MODIFY: daily_reports to link to tasks. |
| Seed data | server/database/seed.sql | Rebuild entirely for new schema with tasks, clients, materials. |
| Projects route | server/src/routes/projects.ts | ADD: client association, budget tracking, survey phase management. |
| Dashboard route | server/src/routes/dashboard.ts | ADD: task-level aggregations, chart data endpoints (tasks by status, by owner, by due date, budget breakdown). |
| DashboardPage | frontend/src/pages/DashboardPage.tsx | ADD: pie charts, bar charts, donut charts, overdue widget. Current summary cards can stay but dashboard needs 4-6 chart widgets. |
| ProjectDetailPage | frontend/src/pages/ProjectDetailPage.tsx | ADD: task list/Kanban, budget section, survey status, evidence gallery. Current chart + metrics stay. |
| App.tsx routing | frontend/src/App.tsx | ADD: routes for tasks, clients, project detail sub-views. |

### REBUILD (current implementation doesn't match requirements)

| Item | Why Rebuild |
|------|-------------|
| DailyReportForm | Current: single % entry per project. New: task-level completion with evidence upload. Fundamentally different interaction model. |
| ReportPage | Needs to show task assignments (Kanban/table), not just a simple form. |
| CreateProjectForm | Needs: client selection, budget fields, material list, task template, technician assignment, survey setup. Current form is too simple. |
| ProjectsPage | Needs: client info, budget column, task count, survey status column. Current table is too basic. |

### NEW (doesn't exist yet, must be created)

| New Item | Description |
|----------|-------------|
| clients table + CRUD | Client entity: name, address, phone, email |
| tasks table + CRUD | Task entity: project_id, title, status, assignee, due_date, budget, sort_order |
| task_evidence table + upload | Evidence: task_id, file_url, file_type, uploaded_by, uploaded_at |
| materials table | Material: project_id, name, quantity, unit, status (ordered/received/used) |
| survey_approvals table | Survey: project_id, status, proof_url, approved_by, approved_at |
| KanbanBoard component | Drag-and-drop task cards grouped by status |
| Chart components (5-7 new) | PieChart (tasks by status), BarChart (tasks by owner), DonutChart (progress), StackedBar (by due date), BudgetChart, EarnedValueChart |
| FileUpload component | Image/document upload for task evidence |
| ClientForm + ClientsPage | Client management UI |
| TaskBoard page | Kanban + table view of tasks within a project |

---

## RISK ASSESSMENT

| Risk | Severity | Details |
|------|----------|---------|
| Schema migration | HIGH | Adding 4-5 new tables + modifying existing ones. Current seed data will break. Need clean migration path. |
| SPI calculation change | MEDIUM | If task completion drives SPI instead of manual %, the calculator logic must change. Need to decide: keep manual % OR compute from task completion ratio. |
| File upload infrastructure | MEDIUM | No file storage exists. Need to decide: local disk, S3, or base64 in DB (not recommended). |
| Scope creep | HIGH | User stories describe a full Monday.com clone. Must scope to thesis requirements + minimum viable dashboard. |
| LandingPage bloat | LOW | 871-line monolith. Works but should be split if touched. Not blocking anything. |
| Auth register endpoint | LOW | Registration is unprotected (anyone can register as manager). Security concern but not blocking rewrite. |
| Express 5 | LOW | Using Express 5.2.1 (latest). Generally stable but some middleware may behave differently from v4. |

---

## EXPLORATION_REPORT (YAML Summary)

```yaml
EXPLORATION_REPORT:
  entry_point: server/src/app.ts + frontend/src/App.tsx

  backend:
    files: 17
    tables: 5 (users, projects, project_assignments, daily_reports, project_health)
    endpoints: 15 (2 auth, 6 projects, 2 reports, 1 dashboard, 4 users)
    dependencies: 6 runtime (express, pg, bcryptjs, jsonwebtoken, cors, dotenv)
    quality: GOOD -- clean Express patterns, proper auth, typed queries

  frontend:
    files: 28
    pages: 6 (Landing, Login, Dashboard, ProjectDetail, Projects, Report)
    components: 8 (3 dashboard, 2 forms, 3 ui)
    hooks: 2 (useAuth, useDashboard with 11 exports)
    dependencies: 6 runtime (react, react-dom, react-router-dom, @tanstack/react-query, axios, recharts)
    quality: GOOD -- clean component patterns, proper TanStack Query usage, Tailwind v4

  critical_path:
    - User submits daily report -> SPI recalculated -> project_health upserted -> dashboard reflects change
    - Auth: JWT token -> authenticate middleware -> role-based authorize -> route handler

  spi_engine:
    location: server/src/services/spiCalculator.ts
    status: CORRECT per thesis (PV = elapsed/duration * 100, SPI = EV/PV)
    thresholds: green >= 0.95, amber >= 0.85, red < 0.85
    verdict: KEEP core logic, MODIFY input source (tasks vs manual %)

  gaps_vs_user_stories:
    critical_missing:
      - Task-level management (NO tasks table, NO Kanban, NO task status tracking)
      - Budget/financial tracking (ZERO budget fields anywhere)
      - Evidence/proof upload (NO file upload capability)
      - Client management (NO clients table)
      - Survey phase & approval gate (NO survey concept)
      - Material/equipment tracking (NO materials table)
      - Dashboard charts (only 1 LineChart exists; need 5-7 chart types)

    partially_present:
      - Technician assignment (exists at project level, needs task level too)
      - Report system (exists but needs task-level granularity)
      - Dashboard summary (exists but needs chart widgets)

  patterns_found:
    - Consistent ApiResponse<T> wrapper on all endpoints
    - LATERAL JOIN for latest report (efficient PostgreSQL pattern)
    - TanStack Query invalidation chain on mutations
    - Role-based route protection (both backend and frontend)
    - Upsert pattern (ON CONFLICT) for daily reports and health

  NOT_relevant:
    - LandingPage.tsx (871 lines of marketing content -- not part of dashboard rewrite)
    - naskah/ directory (thesis document -- read by separate agent)
    - docs/user-story/image-*.png (already analyzed in this report)

  recommendations:
    - KEEP: Auth system, SPI core, db utility, TanStack hooks pattern, UI primitives
    - MODIFY: Schema (add 4-5 tables), dashboard route (chart data), existing pages
    - REBUILD: Report form (task-based), create project form (rich), projects page
    - NEW: Tasks CRUD, Kanban board, 5-7 chart components, file upload, clients CRUD
    - DECISION NEEDED: Does SPI come from manual % or task completion ratio?
    - DECISION NEEDED: File storage strategy (local disk vs cloud)
    - DECISION NEEDED: How much of Monday.com feature set is in scope for thesis?
```
