---
task_id: "20260404_0001_dashboard_rewrite"
agent: "naomi"
phase: "exploration"
status: "COMPLETE"
timestamp: "2026-04-04T02:30:00Z"
---

# Context: Naomi - Thesis & User Stories Requirements Extraction

## Source Documents Analyzed
1. `naskah/Naskah TA 12-03-26-bak.rtf` -- Full thesis document (3.1MB RTF, extracted to 48,931 chars of text)
2. `docs/user-story/user-stories.md` -- User stories from product owner
3. `docs/user-story/image.png` through `image-3.png` -- 4 reference UI screenshots

**IMPORTANT NOTE:** Thesis chapters 4 (Analysis & Design) and 5 (Implementation) contain section headers but NO text content -- they are placeholder stubs with only headings. All diagrams (ERD, use case, wireframes, class diagrams, sequence diagrams) exist only as embedded images that were stripped during extraction. The implementable requirements must be reconstructed from chapters 1-3 and the user stories.

---

## 1. FUNCTIONAL REQUIREMENTS

### FR-1: Technician Daily Report Input
- Technicians get DIRECT access to the system (currently indirect via manager)
- Technician opens app, selects project, fills daily report form
- Daily report includes: task details, progress percentage (as Earned Value), constraints/notes
- Each completed task adds to the project's schedule completion percentage
- Technician must upload proof for each completed task: photos, documents, forms, screenshot chats

### FR-2: Automatic SPI Calculation Engine
- System auto-calculates SPI on every report submission
- Formula: `SPI = EV / PV`
  - **EV (Earned Value):** Actual progress percentage accumulated from daily reports submitted by technicians
  - **PV (Planned Value):** Target progress percentage that SHOULD have been completed by current date based on baseline schedule
- PV calculation: derived from project duration baseline (start_date, end_date), proportional to elapsed days
- Calculation runs asynchronously in backend after data submission
- No manual intervention required from administrators

### FR-3: Project Health Status (RAG Categorization)
- System auto-categorizes each project into health status based on SPI value:
  - **Green (On Schedule):** SPI >= 1 (or SPI >= 0.95 per CLAUDE.md thresholds)
  - **Amber (Warning):** SPI < 1 but not critical (0.85 <= SPI < 0.95 per CLAUDE.md)
  - **Red (Critical / Behind Schedule):** SPI < 0.85 (triggers EWS)
- Status represented via Red-Amber-Green (RAG) color coding
- Status updates in real-time after new daily report submission

### FR-4: Early Warning System (EWS)
- Proactive mechanism integrated into monitoring dashboard
- Trigger: SPI < 1 (behind schedule detection)
- When triggered: visual warning indicator on dashboard (red color, "Critical" flagging)
- Purpose: eliminate information lag between field progress issues and manager awareness
- Transforms raw daily report data into instant visual insights

### FR-5: Dashboard Visualization (Manager View)
- Central graphical UI showing all active projects with health status
- Projects auto-sorted by urgency: Red -> Amber -> Green (critical first)
- Manager sees portfolio-wide view at a glance
- Data presented as: progress charts, color-coded status metrics, progress bars
- Real-time updates without full page refresh (async data fetching)
- Manager is READ-ONLY -- does not input data

### FR-6: Project Detail View
- Per-project drill-down showing:
  - Actual progress vs. ideal/planned progress
  - Deviation percentage
  - Historical daily reports
  - Latest constraint notes from technicians
  - SPI trend over time

### FR-7: Project Management (Manager)
- Manager receives client, collects details (name, address, phone)
- Manager adds client to system
- Manager creates project plan: budget estimate (RAB), project name, target deadline, equipment needs
- Manager assigns technicians to tasks (per-task or per-project with auto-assign button for bulk assignment)
- Each project starts with a survey phase, must be approved with proof from technician before proceeding to execution tasks
- Manager determines project monetary value (in Rupiah)

### FR-8: Task Management
- Each project consists of: project details, task breakdown, budget plan (RAB), indented/ordered items, assigned technicians
- Projects divided into: survey phase and execution phase (survey must precede execution)
- Technician selects which project/task to work on
- Task completion evidence: photo upload, documents, forms, chat screenshots
- View modes: Kanban board OR list/table view

### FR-9: Authentication
- Login system for technicians and managers
- Role-based access (at minimum 2 roles: Teknisi Lapangan, Manajer Proyek)

---

## 2. DATA MODEL REQUIREMENTS

### Entities Identified from Thesis + User Stories

**Users**
- id, name, email, role (technician | manager | admin), password_hash
- Relationships: assigned to projects, creates daily reports

**Clients**
- name, address, phone number
- Linked to projects

**Projects**
- id, name, start_date, end_date, duration, status
- Project value (Rupiah amount)
- Project type: survey vs execution (survey must precede execution)
- Budget plan (RAB - Rancangan Anggaran Biaya)
- Equipment/material needs
- Target/goal description or document
- Relationships: has tasks, has daily_reports, has assigned technicians, has project_health, belongs to client

**Tasks**
- id, project_id, task_name, assigned_technician(s), status, due_date, order/sequence
- Evidence/proof attachments (photos, documents, screenshots)
- Task completion contributes to project progress percentage

**Daily Reports**
- id, project_id, report_date, progress_percentage, constraints/notes, created_by (technician)
- Triggers: SPI recalculation, health status update

**Project Health (denormalized for performance)**
- project_id, spi_value, status (green/amber/red), deviation_percent, last_updated
- Auto-updated by SPI calculation engine

**Budget/RAB Items**
- project_id, item_name, quantity, unit_price, total
- Material/equipment tracking

---

## 3. DASHBOARD / VISUALIZATION REQUIREMENTS

### From Thesis
1. **RAG color indicators** on each project card (Green/Amber/Red)
2. **Progress bars** showing actual vs planned progress
3. **Charts:** Progress graphs, SPI trend charts
4. **Metrics dashboard:** Portfolio summary of all active projects
5. **Auto-sorting** by urgency (Red first, then Amber, then Green)
6. **Real-time updates** after new report submission (no page refresh needed)
7. **Deviation display:** Shows numerical deviation percentage per project

### From User Stories / Reference Screenshots
8. **Project overview widgets:** All Tasks count, Done count, Working on it count, Stuck count
9. **Tasks by status:** Pie chart (Working on it / Stuck / Done)
10. **Tasks by owner:** Bar chart showing workload distribution per technician
11. **Overdue tasks:** Bar chart highlighting stuck/overdue items
12. **Tasks by due date:** Stacked bar chart across time periods
13. **Kanban board view:** Cards with owner, status badge (Stuck/Working on it/Done), due date
14. **Table/list view:** Columns for Task, Owner, Status, Due date, Timeline (Gantt-like bar), Notes, Budget, Last updated
15. **Work Item Progress:** Donut/ring chart
16. **Milestone Status:** Pie chart
17. **Task Planned vs Actual:** Comparison chart
18. **Earned Value Analysis:** Chart (from Zoho Projects reference screenshot)

---

## 4. USER ROLES AND PERMISSIONS

| Role | Capabilities |
|------|-------------|
| **Teknisi Lapangan (Field Technician)** | Login, view assigned projects/tasks, select task to work on, submit daily report (progress %, notes, evidence uploads), view own task status in kanban/list |
| **Manajer Proyek (Project Manager)** | Login, receive/add clients, create projects, set budget/RAB, assign technicians to tasks, view dashboard (READ-ONLY monitoring), evaluate Project Health Status, respond to EWS alerts, determine project value, approve survey completion |

User stories also mention an "admin" role but thesis scopes to 2 primary roles.

---

## 5. SPI CALCULATION METHODOLOGY (Exact from Thesis)

### Formula
```
SPI = EV / PV
```

### Variables
- **SPI (Schedule Performance Index):** Time efficiency index for project execution
- **EV (Earned Value):** Actual work completion percentage, accumulated automatically from daily report progress inputs by technicians
- **PV (Planned Value):** Target work percentage that should be completed at the monitoring point, based on baseline schedule (start_date to end_date)

### Interpretation
| SPI Value | Status | Meaning |
|-----------|--------|---------|
| SPI = 1 | On Schedule | Project running exactly on time. Green indicator. |
| SPI > 1 | Ahead of Schedule | Project running faster than planned. Green indicator. |
| SPI < 1 | Behind Schedule | Project experiencing delay. Triggers EWS. Red indicator. |

### Thresholds (from CLAUDE.md -- confirmed design decisions)
| Range | Status | Color |
|-------|--------|-------|
| SPI >= 0.95 | On Track | Green |
| 0.85 <= SPI < 0.95 | Warning | Amber |
| SPI < 0.85 | Critical | Red |

### PV Calculation Logic
```
PV = (Days Elapsed since start_date / Total Project Duration in days) * 100%
```

### EV Source
- Accumulated from progress_percentage fields in daily_reports
- Latest daily report's progress_percentage = current EV for that project

---

## 6. EARLY WARNING SYSTEM (EWS) DETAILS

From thesis section 2.2.5:
- EWS is a proactive mechanism, NOT predictive/ML-based
- Uses SPI as the trigger parameter
- Operates on factual real-time data processing
- Purpose: eliminate information lag between field issues and management awareness
- When SPI < 1: system immediately triggers visual warning (color change to red, "Critical" flag)
- Integrates directly with dashboard UI via Next.js async rendering
- Backend processes daily report data continuously, calculates SPI ratio automatically

---

## 7. WIREFRAMES / UI DESCRIPTIONS

### From Thesis Text
- Dashboard contains: progress graphs, color metrics (RAG), progress bars
- Layout: modular, component-based (mentioned React/Next.js component architecture)
- Real-time rendering without full page refresh
- Table layout for daily reports
- Color-coded project cards

### From Reference Screenshots (user-story folder)
**image.png:** Monday.com table view
- Columns: Task, Owner, Status (badge: Working on it/Done/Stuck), Due date, Timeline (Gantt bar), Notes, Budget, Last updated
- Color-coded timeline bars
- "New task" button, search, person filter, sort, hide, group by controls
- Total budget summation row

**image-1.png:** Zoho Projects dashboard
- 6 chart widgets: Work Item Progress (donut), Milestone Status (pie), Budget Status (bar), Issue Status (pie), Task Planned vs Actual (stacked), Earned Value Analysis (pie)
- Left sidebar: Projects list, Tasks, Issues, Milestones, Timesheets, Expenses navigation

**image-2.png:** Monday.com Kanban/Cards view
- Cards showing: task name, Owner avatar, Status badge (Stuck/Working on it/Done), Due date
- Card-based layout for visual task management

**image-3.png:** Monday.com Dashboard overview
- Summary counters: All Tasks (14), Done (7), Working on it (5), Stuck (2)
- Tasks by status: Pie chart
- Tasks by owner: Bar chart
- Overdue tasks: Bar chart
- Tasks by due date: Stacked bar chart by month

---

## 8. TECHNOLOGY STACK REQUIREMENTS

### From Thesis
- **Frontend Framework:** Next.js (React-based, for SSR and component-based architecture)
- **Purpose:** Async data fetching, real-time dashboard rendering, modular RAG components
- **UML modeling:** Use Case, Sequence, Class, Activity diagrams
- **Database design:** ERD-based, relational (SQL/RDBMS)

### From CLAUDE.md (Confirmed Design Decisions)
- **Frontend:** Vite + React + TanStack Query (NOTE: thesis says Next.js, CLAUDE.md says Vite+React)
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL with Prisma or TypeORM ORM
- **Scope:** Greenfield build from scratch
- **Scale:** Enterprise (100+ projects)

### CONFLICT: Thesis specifies Next.js; CLAUDE.md specifies Vite + React + TanStack Query.
Recommendation: Follow CLAUDE.md (the confirmed design decision) since thesis is academic, and Vite+React+TanStack is already decided.

---

## 9. SUCCESS CRITERIA / EVALUATION METRICS

From thesis:
1. Technicians can input daily reports directly into the system
2. SPI auto-calculated from daily report data without manual intervention
3. Dashboard displays all active projects with RAG status indicators
4. Projects auto-sorted by criticality (Red -> Amber -> Green)
5. Real-time updates after new report submission
6. Manager gets portfolio-wide view of all projects
7. System handles 100+ projects efficiently
8. Data accuracy verified (SPI calculation correctness)
9. UAT (User Acceptance Testing) approval achieved
10. Black Box Testing passes for all features

### From Thesis Methodology
- Prototyping SDLC approach with iterative feedback
- Data integrity testing with real PT SHI daily report data
- Integration testing of SPI calculation + dashboard rendering

---

## 10. SCOPE BOUNDARIES

### INCLUDED (Explicit)
- Direct technician daily report input
- Automatic SPI calculation
- RAG status indicators
- Real-time dashboard visualization
- Early Warning System (threshold-based)
- Project prioritization by urgency
- Project management (create, assign, track)
- Task management with evidence uploads
- Survey phase -> Execution phase workflow
- Client management (basic)
- Budget/RAB tracking

### EXCLUDED (Explicit from thesis)
- Financial data beyond basic RAB/project value
- Machine learning or predictive analytics
- Complex multi-level permissions beyond 2 roles
- Gantt charts (mentioned as out of scope vs Auliansyah 2023)
- Material procurement system
- Human resource management system
- Custom comparison periods beyond baseline

### GRAY AREA (mentioned in user stories but not thesis)
- Auto-assign button for bulk technician assignment
- Kanban board view (referenced in screenshots)
- Budget summation/tracking columns

---

## EXPLORATION SUMMARY

```yaml
EXPLORATION_REPORT:
  entry_point: "naskah/Naskah TA 12-03-26-bak.rtf + docs/user-story/user-stories.md"
  critical_path:
    - "Chapter 1: Problem statement, scope, requirements"
    - "Chapter 2: SPI/EVM methodology, EWS theory, RAG system"
    - "Chapter 3: Prototyping methodology, business process, actor roles"
    - "User stories: Task management, evidence uploads, kanban/list views"
    - "Reference screenshots: 4 UI mockups from Monday.com and Zoho Projects"
  problem_domain: "Project management dashboard with SPI-based health monitoring"
  patterns_found:
    - "SPI = EV/PV is the core calculation engine"
    - "RAG (Red-Amber-Green) color coding is universal across all views"
    - "Two primary actors: Technician (input) and Manager (monitor)"
    - "Survey -> Execution phase workflow for projects"
    - "Evidence-based task completion (photo/doc uploads)"
    - "Real-time async updates (no page refresh)"
  risks_identified:
    - "Thesis chapters 4-5 are empty stubs -- no ERD, wireframes, or class diagrams available"
    - "Tech stack conflict: thesis says Next.js, CLAUDE.md says Vite+React"
    - "SPI thresholds differ: thesis says SPI<1 is behind schedule, CLAUDE.md uses 0.95/0.85 bands"
    - "User stories add scope not in thesis: client management, budget/RAB, auto-assign, kanban"
    - "No explicit API design in thesis"
  NOT_relevant:
    - "Chapter 2 literature review comparisons (academic padding)"
    - "UML symbol reference tables (textbook content)"
    - "Database theory section 2.2.9-2.2.10 (generic SQL/DBMS theory)"
    - "Academic formatting (dewan penguji, abstrak, sistematika)"
  recommendations:
    - "Use CLAUDE.md tech stack (Vite+React+TanStack) not thesis Next.js"
    - "Implement 3-tier RAG: Green >= 0.95, Amber 0.85-0.95, Red < 0.85"
    - "Data model needs: users, clients, projects, tasks, daily_reports, project_health, budget_items"
    - "MVP scope: auth + project CRUD + task CRUD + daily report + SPI engine + dashboard"
    - "Defer from MVP: kanban view, auto-assign, budget tracking (user story extras)"
    - "Need to design ERD from scratch since thesis Chapter 4 is empty"
```
