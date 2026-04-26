# Tanaka Context — Phases 10-11-12

## Project
PT SHI Dashboard — Next.js 15 App Router, PostgreSQL, TanStack Query 5, Tailwind CSS v4
Root: /Users/user/Documents/COLLEGE/Mata Kuliah/8/Tugas Akhir/coding/project_ta_dian_putri_iswandi/frontend/

## Previously Completed (Phases 1-9)
1. Remove Budget/RAB UI ✅
2. Client CRUD + lat/lng + photo + audit timeline ✅
3. Task chaining (depends_on) ✅ [DB column now added: 2026-04-26]
4. Double-booking validator ✅
5. Schedule calendar view ✅
6. EntityActivityTimeline on all entities ✅
7. Technician Dashboard charts ✅
8. Admin User Management + deactivate/activate ✅
9. Technician Statistics (was already implemented) ✅

## New Phases

### Phase 10: Survey Phase Flow
- projects table has: phase (survey|execution), survey_approved (boolean)
- Full lifecycle: create project in survey phase → fill survey form → manager approves → execution begins
- Need to understand: what survey form fields exist, how survey_approved is toggled, what UI shows for survey vs execution phase
- Key constraint: technicians cannot approve surveys (manager/admin only)

### Phase 11: Global Search (Cmd+K)
- Search across: projects (name, code, client), tasks (name, description), clients (name, address, phone)
- Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
- UI: modal overlay with instant results grouped by entity type
- Need single backend search endpoint or per-entity searches

### Phase 12: Timeline / Gantt View
- Horizontal bars showing task timelines (timeline_start to timeline_end)
- Tasks grouped by project
- Dependencies shown (depends_on)
- Navigation: zoom in/out, scroll left/right
- Need to understand: what timeline data already exists, is there a GanttChart component

## Key Files to Explore
- src/views/ProjectDetailPage.tsx — survey_approved display, phase handling
- src/lib/handlers/projects.ts — survey approval endpoint
- src/views/SchedulePage.tsx — existing Gantt/calendar toggle
- Any GanttChart component already built
- src/app/api/[...route]/route.ts — search endpoint presence
