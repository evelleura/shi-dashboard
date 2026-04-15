# Thesis Documentation Index

## Project: PT Smart Home Inovasi Dashboard Development
**Author:** Dian Putri Iswandi (5220311118)  
**Date:** 2026  
**Institution:** Universitas Teknologi Yogyakarta

---

## Quick Navigation

### Core Documents

| Document | Purpose | Key Sections |
|----------|---------|--------------|
| **01_OVERVIEW.md** | Executive summary & project context | Project vision, stakeholders, benefits, constraints |
| **02_PROBLEM_STATEMENT.md** | Business problem & research objectives | Background, problem definition, scope, success criteria |
| **03_ARCHITECTURE.md** | System design & technical framework | Tech stack, user roles, SPI logic, EWS mechanism, data flow |
| **04_DATA_MODEL.md** | Database design & entity relationships | 10 core tables, SQL queries, indexing strategy, constraints |
| **05_UML_DIAGRAMS.md** | Process modeling & system structure | Use cases, activity flows, sequence diagrams, class hierarchy |
| **06_IMPLEMENTATION.md** | Development phases & technical execution | 8 development phases, API endpoints (52), components, testing |
| **07_CONCLUSIONS_AND_REFERENCES.md** | Research findings & bibliography | Conclusions, limitations, recommendations, 24 references |

---

## Document Reading Guide

### For Managers/Stakeholders
**Start Here:** `01_OVERVIEW.md` → `02_PROBLEM_STATEMENT.md` → `06_IMPLEMENTATION.md` (Results section)

**Time Investment:** ~30 minutes  
**Key Takeaway:** What problem does the dashboard solve? What are the benefits?

---

### For Project Architects
**Start Here:** `03_ARCHITECTURE.md` → `04_DATA_MODEL.md` → `05_UML_DIAGRAMS.md`

**Time Investment:** ~1.5 hours  
**Key Takeaway:** How is the system structured? What are the key design patterns?

---

### For Developers/Implementers
**Start Here:** `04_DATA_MODEL.md` → `06_IMPLEMENTATION.md` → `03_ARCHITECTURE.md`

**Time Investment:** ~2 hours  
**Key Takeaway:** What needs to be built? How should data flow? What are the APIs?

---

### For Researchers/Thesis Reviewers
**Start Here:** `01_OVERVIEW.md` → `02_PROBLEM_STATEMENT.md` → `07_CONCLUSIONS_AND_REFERENCES.md`

**Time Investment:** ~2 hours  
**Key Takeaway:** What is the research contribution? How is it validated? What's next?

---

## Section Breakdown

### 1. OVERVIEW (01_OVERVIEW.md)
- Project identity & author info
- PT SHI case study context
- Thesis goals (1 main question)
- Manfaat penelitian (5 benefits)
- Tech stack summary
- Exclusions/scope boundaries
- Cross-references to other documents

---

### 2. PROBLEM STATEMENT (02_PROBLEM_STATEMENT.md)
- **Latar Belakang:** 4 main problems identified
  1. Akses Teknisi Terbatas
  2. Ketiadaan Visualisasi
  3. Deteksi Masalah Lambat (Reactive)
  4. Pengambilan Keputusan Subjektif

- **Rumusan Masalah:** 1 research question

- **Batasan Masalah:** 6 scope boundaries
  - Data types (daily reports only)
  - Calculation method (no ML/AI)
  - Output format (RAG dashboard)
  - Exclusions (no finance, HR, Gantt)

- **Tujuan & Manfaat:** Research goals and expected outcomes

- **Kriteria Keberhasilan:** 5 success criteria

---

### 3. ARCHITECTURE (03_ARCHITECTURE.md)
- **System Layers:** Frontend → API → Database → Storage

- **Tech Stack Details:**
  - Frontend: React 19, TanStack Query, Recharts, Tailwind
  - Backend: Node.js, Express, TypeScript
  - Database: PostgreSQL
  - Storage: Local disk (server/uploads/)

- **User Roles:**
  - Technician: Input daily report, view tasks
  - Manager: Monitor dashboard, approve tasks
  - Admin: User management

- **Core Business Logic:**
  - SPI Formula: EV / PV
  - RAG Thresholds: Green (≥0.95), Amber (0.85-0.95), Red (<0.85)
  - Health Status Categorization

- **Early Warning System (EWS):**
  - Trigger: SPI < 1.0
  - Action: Reorder projects, flag as critical
  - NO ML, just automated comparison

- **Data Flow:** Input → Database → Backend Calc → API → Frontend → Visualization

- **8 Chart Types:** Status distribution, task breakdown, workload, earned value, etc.

---

### 4. DATA MODEL (04_DATA_MODEL.md)
- **10 Core Tables:**
  1. users
  2. clients
  3. projects
  4. project_assignments
  5. tasks
  6. task_evidence
  7. materials
  8. budget_items
  9. daily_reports
  10. project_health (denormalized)

- **Entity Relationships:** 1:N, 1:1, N:N mappings

- **Key Constraints:**
  - Foreign keys with cascade delete
  - Unique constraints (email, project-user pairing)
  - Check constraints (date ordering, value ranges)

- **Critical Queries:**
  - SPI calculation query
  - Kanban board queries
  - Task filtering with computed states

- **Indexing Strategy:** 7 indexes on hot paths
  - projects(status, created_at)
  - tasks(project_id, status)
  - daily_reports(project_id, report_date)

---

### 5. UML DIAGRAMS (05_UML_DIAGRAMS.md)
- **Use Case Diagram:** 6 use cases per actor, include/extend relationships

- **Activity Diagrams (6 types):**
  1. Login & Logout
  2. Daily Report Submission (KEY: auto SPI calculation)
  3. Kelola Proyek
  4. Lihat Dashboard
  5. Task Management
  6. Escalation & Review

- **Sequence Diagrams (6 types):** Message flows for each activity

- **Class Diagram:** Entity attributes, methods, relationships

- **Statechart:** Task lifecycle (to_do → working_on_it → done)

- **Note on .drawio Files:** Located in `/thesis/DIAGRAMS/` subdirectory

---

### 6. IMPLEMENTATION (06_IMPLEMENTATION.md)
- **8 Development Phases:**
  1. Requirements gathering
  2. UI/UX mockups
  3. Prototype testing
  4. Design refinement
  5. Development (52 APIs, 9 pages, 8 charts)
  6. Data integrity testing (unit, integration, black-box)
  7. Bug fixes & re-customization
  8. Production release & UAT

- **API Endpoints (52 total):**
  - Auth (4), Users (4), Clients (5), Projects (8), Tasks (8)
  - Evidence (4), Dashboard (7), Materials (4), Budget (4)

- **Frontend Pages (9):**
  - Dashboard, Projects, ProjectDetail, Clients
  - TechnicianDashboard, TechnicianProjects, TechnicianTasks
  - Login, Landing

- **SPI Calculation Code:** Backend business logic example

- **TanStack Query Usage:** Real-time dashboard sync

- **Testing Strategy:** Unit, integration, black-box, database integrity

- **Performance Metrics:** Load time, API response, chart rendering

---

### 7. CONCLUSIONS & REFERENCES (07_CONCLUSIONS_AND_REFERENCES.md)
- **Kesimpulan (Conclusions):**
  - ✓ Tujuan penelitian tercapai
  - ✓ Manfaat terealisasi (objektif, deteksi dini, efisiensi)
  - ✓ Pendekatan validated

- **Analisis Kritis:**
  - Kekuatan: Real-time visibility, low complexity, scalable
  - Limitasi: Simple SPI, reactive not predictive, fixed thresholds, local storage

- **Saran (Recommendations):**
  - Implementasi: Training, change management, data quality governance
  - Phase 2: ML/AI, predictive, cloud storage, mobile app, notifications
  - Research: Comparative studies, cross-industry validation

- **Daftar Pustaka (References):** 24 citations
  - 7 prior research papers (dashboard studies)
  - 8 theoretical references (UML, database, monitoring concepts)
  - 9 technical documentation (frameworks, tools)

---

## Key Diagrams Summary

### 1. Use Case Diagram
- **Aktor:** Technician, Manager, Admin
- **Main Use Cases:** Login, Daily Report, Dashboard, Task Management
- **Relationships:** Include, extend

### 2. Activity Diagram: Daily Report Flow (CRITICAL)
```
Input Report → Submit → Backend Auto-Calc SPI → Update project_health 
→ Dashboard Auto-Reorder (RED→AMBER→GREEN) → Manager Alerted
```

### 3. Sequence Diagram: Dashboard Update
```
User Access → API Fetch (TanStack Query) → Calculate SPI 
→ Return JSON → Frontend Re-render Charts → Dashboard Updated
```

### 4. Class Diagram
- **Entities:** Project, DailyReport, ProjectHealth, Task, User
- **Key Methods:** calculateSPI(), getHealthStatus(), isOvertime()
- **Relationships:** 1:N and N:N mappings

### 5. Database ERD
- **10 Tables:** Users → Projects → Tasks → DailyReports
- **Denormalized:** ProjectHealth table for dashboard performance

---

## Document Statistics

| Metric | Count |
|--------|-------|
| **Total Pages (Markdown)** | ~100 pages equivalent |
| **Code Examples** | 15+ (SQL, TypeScript, React) |
| **Tables** | 30+ reference tables |
| **Diagrams Referenced** | 10+ UML diagrams |
| **API Endpoints Documented** | 52 endpoints |
| **Database Tables** | 10 core tables |
| **References** | 24 bibliographic citations |
| **User Roles Covered** | 3 (Technician, Manager, Admin) |

---

## Quick Reference: SPI Calculation

**Formula:**
```
SPI = EV / PV

Where:
- EV (Earned Value) = Latest progress_percentage from daily_reports
- PV (Planned Value) = (Days Elapsed / Total Project Duration) × 100

Status Mapping:
- SPI ≥ 0.95 → GREEN (On Track)
- 0.85 ≤ SPI < 0.95 → AMBER (Warning)
- SPI < 0.85 → RED (Critical)
```

**Auto-Update Trigger:** When daily_reports is inserted/updated

---

## Quick Reference: Data Flow

**Input:** Technician submits daily report with progress %
**Processing:** Backend auto-calculates SPI using project baseline dates
**Storage:** Result stored in project_health table (denormalized)
**Display:** Dashboard fetches project_health via REST API
**Sync:** TanStack Query polls every 5 minutes OR refetches on daily_report submit
**Output:** Manager sees RAG indicators, project list sorted by status

---

## Version Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-15 | Initial thesis documentation complete |

---

## How to Use These Files

### For PDF/Print Output
1. Read all markdown files sequentially
2. Include diagrams from DIAGRAMS/ folder
3. Use table of contents from this INDEX
4. Export to PDF with consistent formatting

### For Web/Digital
1. Host markdown files on wiki/knowledge base
2. Create hyperlinks between sections
3. Embed or link .drawio files
4. Use GitHub Pages or similar for version control

### For Development
1. Use 04_DATA_MODEL.md for database schema
2. Use 06_IMPLEMENTATION.md for API specs
3. Use 05_UML_DIAGRAMS.md for component design
4. Cross-reference 03_ARCHITECTURE.md for data flow

### For Presentation
1. Extract key points from 01_OVERVIEW.md
2. Use diagrams from 05_UML_DIAGRAMS.md
3. Show architecture from 03_ARCHITECTURE.md
4. Highlight benefits from 02_PROBLEM_STATEMENT.md

---

## Next Steps

1. **Review:** All stakeholders review respective sections
2. **Feedback:** Collect comments on design & approach
3. **UAT Planning:** Schedule user acceptance testing
4. **Deployment:** Prepare production environment
5. **Training:** Conduct user training for Technician & Manager roles
6. **Monitoring:** Set up dashboard monitoring & alerting

---

**Last Updated:** 2026-04-15  
**Status:** Complete, Ready for Review & Implementation
