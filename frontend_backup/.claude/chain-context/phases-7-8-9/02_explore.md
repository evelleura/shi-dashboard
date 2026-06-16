# Naomi Exploration Results

## Phase 7: Technician Dashboard
- TechnicianDashboard.tsx EXISTS and references TechProductivityChart + TechTimeSpentChart (MISSING)
- useDashboard.ts has useTechProductivityChart + useTechTimeSpentChart hooks → call getTechnicianProductivity/getTechnicianTimeSpent
- services/api.ts has getTechnicianProductivity + getTechnicianTimeSpent functions
- handlers/dashboard.ts MISSING getTechnicianProductivity + getTechnicianTimeSpent implementations
- types/index.ts has TechProductivityData + TechTimeSpentData types

### What to build:
1. handlers/dashboard.ts: add getTechnicianProductivity + getTechnicianTimeSpent functions
2. route.ts: add dispatch for GET /api/dashboard/technician/productivity and /time-spent
3. NEW: src/components/charts/TechProductivityChart.tsx
4. NEW: src/components/charts/TechTimeSpentChart.tsx

## Phase 8: Admin User Management
- UserManagementPage.tsx EXISTS and is fully implemented
- handlers/users.ts has full CRUD (create/update/delete/resetPassword/listUsers)
- MISSING: is_active column on users table
- MISSING: deactivate/activate endpoints
- Need DB migration + handler updates + UI toggle

### What to build:
1. DB migration: ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE
2. handlers/users.ts: update listUsers to include is_active; add deactivateUser + activateUser
3. route.ts: add dispatch for POST /api/users/:id/deactivate and /activate
4. services/api.ts: add deactivateUser + activateUser functions
5. hooks/useUsers.ts: add useDeactivateUser + useActivateUser mutations
6. UserManagementPage.tsx: add is_active column + toggle button

## Phase 9: Technician Statistics
- TechnicianManagementPage.tsx EXISTS and is FULLY IMPLEMENTED
- handlers/users.ts listTechnicians already aggregates: project_count, total_tasks, completed, active, overdue, time_spent, evidence_count
- getTechnicianDetail returns full per-technician breakdown
- NO WORK NEEDED — already complete

## Key Types
- TechProductivityData: { week_start: string; completed: number }
- TechTimeSpentData: { project_id: number; project_name: string; hours: number }
- User: { id, name, email, role, created_at } — needs is_active added

## DB columns confirmed existing on tasks:
- time_spent_seconds, is_tracking, timer_started_at ✓
- depends_on (added by Phase 3 migration) ✓
