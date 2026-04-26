# Tanaka Context — Phases 7-8-9

## Project
PT SHI Dashboard — Next.js 15 App Router, PostgreSQL, TanStack Query 5, Tailwind CSS v4
Root: /Users/user/Documents/COLLEGE/Mata Kuliah/8/Tugas Akhir/coding/project_ta_dian_putri_iswandi/frontend/

## Previously Completed (Phases 1-6)
1. Remove Budget/RAB UI ✅
2. Client CRUD + lat/lng + photo + audit timeline ✅
3. Task chaining (depends_on) ✅
4. Double-booking validator ✅
5. Schedule calendar view ✅
6. EntityActivityTimeline on all entities ✅

## New Phases

### Phase 7: Technician Dashboard
- Role: technician
- Dedicated home screen replacing generic dashboard for technician login
- My tasks (assigned_to = current user): grouped by status, with timer controls
- Blocked tasks highlighted with lock icon + depends_on_name
- Timer summary: total time tracked today/this week
- No admin/manager-only data

### Phase 8: Admin User Management
- Role: admin
- New page/view at /admin/users (or as tab on existing admin area)
- List all users with: name, email, role, created_at, status (active/deactivated)
- Create user: name, email, role, password
- Edit user: change name, email, role
- Deactivate/reactivate user (soft delete via active boolean column or similar)
- Bahasa Indonesia labels

### Phase 9: Technician Statistics (for Manager)
- Role: manager/admin can view
- Per-technician KPIs:
  - Tasks completed (done) total and by month
  - Time spent (sum time_spent_seconds formatted)
  - On-time rate: tasks completed before due_date / total completed tasks
  - Current workload: active tasks count
- Visual: table or cards per technician, possibly bar chart

## Key Files to Explore
- src/views/ — existing pages
- src/lib/handlers/ — API handler functions
- src/app/api/[...route]/route.ts — routing
- src/services/api.ts — frontend API calls
- src/hooks/ — TanStack Query hooks
- src/types/index.ts — shared types
- Database schema: check users table for active/deactivated column
