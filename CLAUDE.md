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

**Business Impact:** Reactive (not preventive) problem detection → delays and customer dissatisfaction

## Solution Architecture

### Tech Stack (CONFIRMED)
- **Frontend:** Vite + React + TanStack Query
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL (with Prisma or TypeORM ORM)
- **Scope:** Greenfield (build from scratch)
- **Scale:** Enterprise (100+ projects)

### Key Metrics & Thresholds
- **SPI Calculation:** `SPI = EV (Actual Progress %) / PV (Planned Progress %)`
- **Planned Value (PV):** `(Days Elapsed / Total Project Duration) × 100%`
- **Health Status Thresholds:**
  - Green: SPI ≥ 0.95 (on track)
  - Amber: 0.85 ≤ SPI < 0.95 (warning)
  - Red: SPI < 0.85 (critical - behind schedule)

### User Roles
1. **Field Technician:** Input daily reports (actual progress %)
2. **Project Manager:** Read-only dashboard access (monitor health, make decisions)

## Critical Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL | Better performance at scale, JSONB support, strong data integrity |
| ORM | Prisma/TypeORM | Type safety, migration management, connection pooling |
| State Mgmt | TanStack Query | Real-time sync, background refetch, optimistic updates |
| SPI Calculation | Automatic on report submit | Reduces manual work, ensures data freshness |
| Health Thresholds | Fixed (0.95, 0.85) | Simple, predictable, meets thesis requirements |
| Dashboard Sorting | Auto by urgency (Red→Amber→Green) | Immediate visibility of critical projects |

## Data Model (PostgreSQL)
```
projects
├── id, name, start_date, end_date, duration, status
└── relationships: user assignments, daily_reports, project_health

users
├── id, name, email, role (technician|manager|admin), password_hash
└── relationships: created daily_reports, assigned to projects

daily_reports
├── id, project_id, report_date, progress_percentage, constraints, created_by
└── triggers: SPI recalculation, health status update

project_health (denormalized for performance)
├── project_id, spi_value, status, deviation_percent, last_updated
└── auto-updated by SPI engine
```

## API Endpoints (Core)
- `POST /api/projects` - Create project
- `GET /api/projects` - List with health status
- `GET /api/projects/:id` - Detail + history
- `POST /api/daily-reports` - Submit report (technician)
- `GET /api/dashboard` - Aggregated view (manager)

## Frontend Components (Core)
- `DashboardLayout` - Main container
- `ProjectHealthGrid` - Grid of projects
- `ProjectCard` - Individual project RAG indicator
- `ProjectDetailView` - Historical progress + reports
- `DailyReportForm` - Technician input form
- `useDashboard` hook - TanStack Query integration

## Scope Boundaries
### INCLUDED
- Direct technician daily report input
- Automatic SPI calculation
- Red-Amber-Green status indicators
- Real-time dashboard visualization
- Early Warning System (threshold-based)
- Project prioritization by urgency

### EXCLUDED
- Financial data/cost tracking
- Material procurement
- Human resource management
- Budget allocation
- Gantt charts
- Complex multi-level permissions
- Custom comparison periods beyond baseline

## Implementation Phases
1. **Phase 1:** Backend initialization + PostgreSQL schema
2. **Phase 2:** SPI calculation engine + health logic + API routes
3. **Phase 3:** Dashboard UI components + TanStack Query integration
4. **Phase 4:** Testing, UAT, deployment

## Success Criteria
✓ Technicians can input daily reports directly
✓ SPI auto-calculated from reports
✓ Dashboard displays all active projects with RAG status
✓ Projects sorted by criticality
✓ Real-time updates after new report
✓ Manager view of entire portfolio
✓ Handles 100+ projects efficiently
✓ Data accuracy verified
✓ UAT approval achieved
