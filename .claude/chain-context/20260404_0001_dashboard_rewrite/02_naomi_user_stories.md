---
task_id: "20260404_0001_dashboard_rewrite"
agent: "naomi"
phase: "exploration"
status: "COMPLETE"
timestamp: "2026-04-04T02:15:00Z"
---

# User Story & Requirements Extraction

## Source Files Analyzed
- `D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\docs\user-story\user-stories.md` (text)
- `D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\docs\user-story\image.png` (Monday.com table view)
- `D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\docs\user-story\image-1.png` (Zoho Projects dashboard)
- `D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\docs\user-story\image-2.png` (Monday.com Kanban/card view)
- `D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\docs\user-story\image-3.png` (Monday.com dashboard widgets)

---

## 1. PROJECT STRUCTURE MODEL

Each "project" (proyek) consists of:
1. **Project details** (rincian proyek)
2. **Task details** (rincian task)
3. **Budget plan** (rancangan anggaran)
4. **Indented/ordered materials** (barang yang di-indent)
5. **Assigned technicians** (teknisi yang terlibat)

### Project Phases (MANDATORY SEQUENCE)
```
Phase 1: SURVEY (survei proyek)
  -> Technician performs site survey
  -> Uploads survey evidence (photos, documents)
  -> Manager approves survey results
  -> GATE: Must be approved before Phase 2

Phase 2: EXECUTION (pengerjaan proyek)
  -> Task-by-task completion
  -> Each task requires evidence upload
  -> Progress tracked via completion percentage
  -> Each completed task increases project SPI/schedule index
```

**Critical constraint:** Survey phase MUST precede execution phase. No work can begin until survey is approved.

---

## 2. USER STORIES BY ROLE

### 2.1 TECHNICIAN (Teknisi)

| ID | User Story | Acceptance Criteria |
|----|-----------|---------------------|
| T-01 | As a technician, I can log in to the dashboard | Auth system with technician role |
| T-02 | As a technician, I can see a dashboard overview | Dashboard landing page after login |
| T-03 | As a technician, I can see projects and tasks assigned to me | Filtered view showing only MY assignments |
| T-04 | As a technician, I can see overdue projects (past deadline, not complete) | Visual indicator for overdue projects |
| T-05 | As a technician, I can choose which project to work on | Project selection/navigation |
| T-06 | As a technician, I can upload evidence for each completed task | File upload: photos, documents, forms, screenshot of chats |
| T-07 | As a technician, I can see my tasks in Kanban view | Card-based board with status columns |
| T-08 | As a technician, I can see my tasks in table/list view | Tabular view with sortable columns |
| T-09 | As a technician, I can see the target/goal/endpoint of each project | View project target as document, plan, or description |

### 2.2 MANAGER

| ID | User Story | Acceptance Criteria |
|----|-----------|---------------------|
| M-01 | As a manager, I can receive/register a client | Client registration with name, address, phone |
| M-02 | As a manager, I can record project details after client call | Project detail entry form |
| M-03 | As a manager, I can add a client to the system and create a project plan | Client -> Project creation flow |
| M-04 | As a manager, I can set project budget plan | Budget/anggaran entry |
| M-05 | As a manager, I can set project name | Project metadata |
| M-06 | As a manager, I can set project deadline/target date | Due date / tenggat waktu |
| M-07 | As a manager, I can specify required tools/materials | Material/equipment list (indent) |
| M-08 | As a manager, I can assign technicians to tasks individually | Per-task technician assignment |
| M-09 | As a manager, I can assign multiple technicians to a project with auto-assign | Select N technicians for a project, system auto-distributes tasks |
| M-10 | As a manager, I can initiate the survey phase for a project | Survey phase creation |
| M-11 | As a manager, I can approve/reject survey evidence from technician | Survey gate approval workflow |
| M-12 | As a manager, I can set the project monetary value (in Rupiah) | Project value field in IDR |
| M-13 | As a manager, I can view dashboard with charts and metrics | Analytics dashboard (see UI requirements below) |

---

## 3. UI/UX REQUIREMENTS (from images)

### 3.1 Table View (image.png -- Monday.com reference)
Required columns:
- **Task name** (e.g., Proses 1, Proses 2, Proses 3)
- **Owner** (assigned technician, with avatar)
- **Status** (Working on it / Done / Stuck -- color-coded badges)
- **Due date** (date field)
- **Timeline** (visual colored bar showing date range)
- **Notes** (text field per task)
- **Budget** (currency field per task, with group sum/total)
- **Last updated** (timestamp)

Additional table features observed:
- Grouped rows (e.g., "To-Do" group header, collapsible)
- "+ Add task" button within group
- "+ Add new group" button
- Search, Person filter, Filter, Sort, Hide columns, Group by controls
- Color-coded timeline bars (green/yellow/red/blue segments)
- Budget summation row at bottom of group

### 3.2 Kanban/Card View (image-2.png -- Monday.com reference)
Each card displays:
- **Task name** (prominent)
- **Owner** (avatar + name area)
- **Status** badge (color-coded: red=Stuck, orange=Working on it, green=Done)
- **Due date** (with icon, overdue indicated with red icon)
- **File attachment indicator** (paperclip icon)

Card layout features:
- Cards arranged horizontally (not columnar Kanban -- more like a card gallery)
- Add widget button
- Search, Person filter, Filter, Sort controls
- Grid/list toggle icons

### 3.3 Dashboard Analytics View (image-1.png -- Zoho Projects reference)
Charts required:
1. **Work Item Progress** -- donut/ring chart showing completion percentage
2. **Milestone Status** -- pie chart by milestone state
3. **Budget Status** -- horizontal bar chart with currency values (IDR)
4. **Issue Status** -- pie chart by issue category
5. **Task Planned vs Actual** -- comparative bar chart
6. **Earned Value Analysis** -- line/area chart (maps to SPI calculation)

Sidebar features:
- Project list navigation
- Sections: Tasks, Issues, Milestones, Timesheets, Expenses

### 3.4 Dashboard Widgets View (image-3.png -- Monday.com reference)
Widgets required:
1. **Summary KPI cards** -- All Tasks count, Done count, Working on it count, Stuck count (with color indicators)
2. **Tasks by status** -- pie/donut chart (Working on it, Stuck, Done)
3. **Tasks by owner** -- bar chart (horizontal, per technician)
4. **Overdue tasks** -- bar chart (Working on it vs Stuck breakdown)
5. **Tasks by due date** -- stacked bar chart by month (color = status)

---

## 4. DATA REQUIREMENTS

### 4.1 Client Data
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | YES | Client name |
| address | string | YES | Client address |
| phone | string | YES | Phone number |

### 4.2 Project Data
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | YES | Project name |
| client_id | FK | YES | Link to client |
| budget_plan | object/JSON | YES | Rancangan anggaran |
| deadline | date | YES | Target completion date (tenggat waktu) |
| value_idr | decimal | YES | Project monetary value in Rupiah |
| materials | object/JSON | YES | Barang yang di-indent (equipment/materials list) |
| target_description | text | YES | Goal/endpoint of project (document, plan, description) |
| phase | enum | YES | survey / execution |
| survey_approved | boolean | YES | Gate: can only move to execution if true |
| status | enum | YES | Derived or set (active/completed/overdue) |
| start_date | date | YES | Project start |
| duration | computed | -- | Derived from start_date to deadline |

### 4.3 Task Data
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| project_id | FK | YES | Parent project |
| name | string | YES | Task name |
| assigned_to | FK | YES | Technician user ID |
| status | enum | YES | to_do / working_on_it / done / stuck |
| due_date | date | YES | Task deadline |
| timeline_start | date | NO | Visual timeline start |
| timeline_end | date | NO | Visual timeline end |
| notes | text | NO | Free-text notes |
| budget | decimal | NO | Task-level budget |
| last_updated | timestamp | AUTO | Auto-updated |
| order | integer | YES | Sort order within project |
| is_survey_task | boolean | YES | Distinguishes survey tasks from execution tasks |

### 4.4 Evidence/Upload Data
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| task_id | FK | YES | Parent task |
| uploaded_by | FK | YES | Technician user ID |
| file_type | enum | YES | photo / document / form / screenshot |
| file_path | string | YES | Storage path/URL |
| file_name | string | YES | Original filename |
| uploaded_at | timestamp | AUTO | Upload time |
| description | text | NO | Optional description |

### 4.5 User Data
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | YES | Full name |
| email | string | YES | Login credential |
| role | enum | YES | technician / manager / admin |
| password_hash | string | YES | Auth |
| avatar_url | string | NO | Profile picture |

### 4.6 Project Assignment (many-to-many)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| project_id | FK | YES | Project |
| user_id | FK | YES | Technician |
| assigned_at | timestamp | AUTO | When assigned |

---

## 5. WORKFLOW REQUIREMENTS

### 5.1 Project Creation Flow (Manager)
```
1. Register client (name, address, phone)
2. Create project linked to client
3. Set project details:
   a. Project name
   b. Budget plan (rancangan anggaran)
   c. Deadline / target date
   d. Material/equipment needs (indent list)
   e. Project value in IDR
   f. Target/goal description
4. Create survey tasks
5. Assign technicians to project:
   a. OPTION A: Manual per-task assignment
   b. OPTION B: Select N technicians + auto-assign button
6. Project starts in SURVEY phase
```

### 5.2 Survey Phase Flow
```
1. Project starts in survey phase
2. Technician sees survey tasks assigned to them
3. Technician performs site survey
4. Technician uploads evidence (photos, documents, forms, chat screenshots)
5. Manager reviews evidence
6. Manager approves survey -> Project moves to EXECUTION phase
   OR Manager rejects -> Technician must redo survey
```

### 5.3 Execution Phase Flow
```
1. Project in execution phase
2. Technician sees execution tasks assigned to them
3. Technician selects a project to work on
4. For each task:
   a. Technician works on task
   b. Technician uploads evidence (photo, doc, form, screenshot)
   c. Task marked as complete
   d. Completion increases project schedule index (SPI)
5. All tasks done -> Project complete
```

### 5.4 Progress Tracking
```
- Each completed task adds to project completion percentage
- SPI = EV (actual progress %) / PV (planned progress %)
- Schedule index updated automatically on task completion
- Manager sees real-time dashboard with SPI-based health indicators
```

### 5.5 Technician Assignment Logic
Two modes described:
1. **Manual:** Manager assigns specific technician to specific task
2. **Auto-assign:** Manager selects N technicians for a project, presses auto-assign button, system distributes tasks evenly among selected technicians

---

## 6. IMPLICIT REQUIREMENTS (not stated but necessary)

### 6.1 Authentication & Authorization
- Login/logout system (stated: "dia login ke dashboard")
- Role-based access control: technician sees own tasks, manager sees all
- Manager cannot do technician actions (evidence upload) and vice versa

### 6.2 File Upload System
- Multi-file upload per task
- Supported types: images (photos), PDFs/documents, form files, screenshots
- File storage backend (local or cloud)
- File preview/viewing capability
- File size limits

### 6.3 Notification/Alert System (implied by overdue tracking)
- Overdue project detection (past deadline, not complete)
- Visual alerts on technician dashboard for overdue items
- Potentially: notification when tasks are assigned, survey approved/rejected

### 6.4 Survey Approval Workflow
- Manager needs a way to VIEW survey evidence
- Manager needs APPROVE / REJECT action
- Rejection should allow technician to resubmit
- Approval should automatically unlock execution phase

### 6.5 Auto-assign Algorithm
- Input: N selected technicians, M tasks in project
- Output: Even distribution of tasks across technicians
- Edge case: uneven division (M not divisible by N)
- Should this be round-robin, load-balanced, or random?

### 6.6 Dashboard Real-time Updates
- From image-3.png: Stats must reflect current state
- TanStack Query with background refetch aligns with this
- After evidence upload -> task status change -> dashboard metrics update

### 6.7 Budget Tracking
- Per-task budget (from table view image)
- Budget summation per project
- Budget plan vs actual tracking (from Zoho dashboard image)
- Project value in IDR (from manager story)

### 6.8 Timeline/Gantt-like Visualization
- From table view image: colored timeline bars per task
- Date range visualization (start -> end)
- Color coding likely maps to status

### 6.9 Group/Phase Organization
- Tasks grouped by phase (survey group, execution group)
- Collapsible groups in table view
- Ability to add tasks within a group

### 6.10 Client Management
- Client CRUD (implied by "receives client, adds to system")
- Client linked to project(s)
- Client contact info storage

### 6.11 Material/Equipment Tracking
- "Barang yang di-indent" = ordered/requested materials
- Needs structured data: item name, quantity, unit, cost
- Links to project budget

### 6.12 Search and Filter
- From images: Search bar, Person filter, Status filter, Sort, Group by
- Filter by assigned technician
- Filter by status
- Filter by due date
- Sort by any column

---

## 7. RECONCILIATION WITH CLAUDE.md (Project Memory)

The existing CLAUDE.md defines some elements that need reconciliation with user stories:

| CLAUDE.md Concept | User Story Alignment | Delta |
|-------------------|---------------------|-------|
| `daily_reports` table | NOT in user stories -- user stories describe task-level evidence uploads, not daily reports | CONFLICT: User stories are task-based, not daily-report-based |
| SPI = EV/PV formula | Aligns -- user stories say "tiap task yang diselesaikan menambah index schedule" | OK but calculation basis differs (task completion % vs daily report %) |
| `project_health` denormalized table | Aligns with dashboard requirements | OK |
| Fixed thresholds (0.95, 0.85) | Not mentioned in user stories but compatible | OK |
| Field Technician "daily report" flow | User stories describe "evidence upload per task" not daily reports | CONFLICT |
| Manager "read-only dashboard" | User stories give manager FULL CRUD: create clients, projects, assign tasks, approve surveys | CONFLICT: Manager is NOT read-only |

### CRITICAL CONFLICTS TO RESOLVE:
1. **Daily Reports vs Task Evidence:** User stories describe a task-based system where technicians upload evidence per task. The thesis describes daily progress reports. These are fundamentally different models. The user stories should take precedence as they represent the actual desired workflow.

2. **Manager Role Scope:** CLAUDE.md says "read-only dashboard access." User stories give managers full project management capabilities (CRUD clients, projects, tasks, assignments, approvals). User stories should take precedence.

3. **SPI Calculation Basis:** If task-based (not daily-report-based), SPI = (completed tasks / total tasks) or weighted by task difficulty. Needs design decision.

---

## 8. REFERENCE UI MAPPING

The 4 images map to these required views:

| Image | Platform | Maps To |
|-------|----------|---------|
| image.png | Monday.com Table | Technician task list view (table mode) |
| image-1.png | Zoho Projects Dashboard | Manager analytics dashboard |
| image-2.png | Monday.com Cards | Technician task list view (kanban/card mode) |
| image-3.png | Monday.com Dashboard | Manager/Technician project overview widgets |

---

## EXPLORATION REPORT (YAML)

```yaml
EXPLORATION_REPORT:
  entry_point: "docs/user-story/user-stories.md + 4 reference images"
  critical_path:
    - "User stories define 2 roles: Technician (9 stories), Manager (13 stories)"
    - "Project structure: client -> project -> phases (survey -> execution) -> tasks -> evidence"
    - "4 reference UIs: table view, kanban view, analytics dashboard, widget dashboard"
    - "Task-based evidence upload model (NOT daily-report-based)"
    - "Survey phase gate: must be approved before execution begins"
    - "Auto-assign feature for distributing tasks across technicians"
  problem_domain:
    - "CONFLICT: CLAUDE.md describes daily-report model, user stories describe task-evidence model"
    - "CONFLICT: CLAUDE.md says manager is read-only, user stories give manager full CRUD"
    - "IMPLICIT: Client management entity not in CLAUDE.md data model"
    - "IMPLICIT: Material/equipment tracking not in CLAUDE.md data model"
    - "IMPLICIT: Survey approval workflow not in CLAUDE.md"
  patterns_found:
    - "Monday.com is primary UI reference (3 of 4 images)"
    - "Zoho Projects is secondary reference for analytics dashboard"
    - "Both table and kanban views required (technician toggle)"
    - "Budget tracked at both task and project level"
    - "Status model: to_do, working_on_it, done, stuck (Monday.com pattern)"
  risks_identified:
    - "Data model in CLAUDE.md needs significant revision to match user stories"
    - "Survey approval workflow adds complexity not in original thesis spec"
    - "Auto-assign algorithm needs design decision"
    - "File upload/storage strategy needed (photos, docs, forms, screenshots)"
    - "Budget tracking scope unclear (is it EVM-level or simple tracking?)"
  NOT_relevant:
    - "CLAUDE.md daily_reports table design (replaced by task evidence model)"
    - "CLAUDE.md 'Field Technician: Input daily reports' flow (replaced by task evidence upload)"
    - "CLAUDE.md 'Manager: Read-only dashboard access' (manager has full CRUD per user stories)"
  recommendations:
    - "Redesign data model: add clients, materials, evidence tables; remove daily_reports"
    - "Implement 2-phase project lifecycle: survey (gated) -> execution"
    - "Build dual-view task interface: table + kanban toggle"
    - "Build analytics dashboard with 6+ chart types per reference images"
    - "Design auto-assign algorithm (round-robin recommended for simplicity)"
    - "Resolve SPI calculation: task-completion-based instead of daily-report-based"
    - "Add file upload infrastructure for evidence management"
```
