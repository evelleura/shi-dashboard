---
task_id: "20260404_0001_dashboard_rewrite"
agent: "takahashi"
phase: "implementation"
status: "COMPLETE"
timestamp: "2026-04-04T09:00:00Z"
---

# Context: Takahashi - Frontend Overhaul (Remove Stuck, Redesign Technician UX, Add Charts)

## Work Done

### 1. Types Updated (types/index.ts)
- TaskStatus: removed 'stuck', now `'to_do' | 'working_on_it' | 'done'`
- ProjectHealth: `stuck_tasks` -> `overtime_tasks`
- DashboardSummary: `stuck_tasks` -> `overtime_tasks` + added `over_deadline_tasks`
- TasksByOwnerData: `stuck` -> `overtime`
- OverdueTaskData: `overdue_working`/`overdue_stuck` -> `overtime`/`over_deadline`
- TasksByDueDateData: removed `stuck`, added `overtime` + `over_deadline`
- TechnicianDashboardData: replaced `stuck`/`overdue` with `overtime`/`over_deadline`, added `client_name`, `client_address`, `health_status` to assigned_projects

### 2. TaskStatusSelect.tsx - Role-Based Options
- Added `userRole` prop
- Technician: can only select `to_do` and `working_on_it` (cannot set done)
- Manager/Admin: full control (`to_do`, `working_on_it`, `done`)
- If technician views a done task, dropdown is disabled

### 3. KanbanBoard.tsx - 5 Computed Columns
- To Do: status=to_do AND (no due_date OR due_date >= today)
- Working On It: status=working_on_it AND (no due_date OR due_date >= today)
- Done: status=done
- Overtime: status=working_on_it AND due_date < today (amber theme)
- Over Deadline: status=to_do AND due_date < today (red theme)
- Warning/alert icons on overtime and over_deadline column headers
- Accepts userRole prop, passes to KanbanCard

### 4. KanbanCard.tsx
- Added userRole and columnId props
- Passes userRole to TaskStatusSelect
- Overtime/over_deadline column cards get tinted borders

### 5. TaskTable.tsx
- Removed stuck sort ordering
- Added getTaskUrgency() function for overtime/over_deadline computation
- Overtime rows: amber background tint + badge
- Over Deadline rows: red background tint + badge
- Added userRole prop, passes to TaskStatusSelect

### 6. TaskDetailModal.tsx
- Added userRole prop, passes to TaskStatusSelect
- Shows Overtime/Over Deadline badges when applicable

### 7. Layout.tsx - Technician Sidebar Redesigned
- OLD: My Dashboard, Daily Report
- NEW: Dashboard, My Projects, My Tasks
- Added TasksIcon SVG component

### 8. TechnicianDashboard.tsx - Major Rewrite
- Stats cards: Total, To Do, In Progress, Done, Overtime, Over Deadline
- Pie/Donut chart: task status distribution using Recharts
- Horizontal bar chart: tasks per project
- Assigned projects cards with: project name, client name + address, phase badge, health dot, progress bar

### 9. New Pages Created
- TechnicianProjectsPage.tsx: Lists assigned projects with client name, address, phase, health status, task progress
- TechnicianTasksPage.tsx: Full Kanban/table view with role-based status restrictions

### 10. App.tsx - Updated Routes
- Added /my-projects -> TechnicianProjectsPage
- Added /my-tasks -> TechnicianTasksPage
- /projects/:id now accessible by ALL authenticated users (technicians can view their assigned projects)
- Removed /report from technician routes

### 11. Chart Components Updated
- TasksByStatusChart.tsx: stuck -> overtime/over_deadline colors and labels
- TasksByOwnerChart.tsx: stuck -> overtime in bar chart
- OverdueTasksChart.tsx: overdue_working/overdue_stuck -> overtime/over_deadline
- TasksByDueDateChart.tsx: stuck -> overtime + over_deadline bars
- SummaryCards.tsx: stuck -> overtime
- SummaryStatsCards.tsx: stuck -> overtime

### 12. ProjectDetailPage.tsx
- stuck_tasks -> overtime_tasks in metrics
- userRole passed to KanbanBoard, TaskTable, TaskDetailModal

## Verification
- `tsc --noEmit`: 0 errors
- `grep -ri stuck frontend/src/`: 0 matches
- All files read before editing

## Files Modified (17)
- frontend/src/types/index.ts
- frontend/src/components/tasks/TaskStatusSelect.tsx
- frontend/src/components/tasks/KanbanBoard.tsx
- frontend/src/components/tasks/KanbanCard.tsx
- frontend/src/components/tasks/TaskTable.tsx
- frontend/src/components/tasks/TaskDetailModal.tsx
- frontend/src/components/ui/Layout.tsx
- frontend/src/pages/TechnicianDashboard.tsx
- frontend/src/pages/ProjectDetailPage.tsx
- frontend/src/pages/DashboardPage.tsx (no changes needed -- uses SummaryCards)
- frontend/src/components/dashboard/SummaryCards.tsx
- frontend/src/components/charts/SummaryStatsCards.tsx
- frontend/src/components/charts/TasksByStatusChart.tsx
- frontend/src/components/charts/TasksByOwnerChart.tsx
- frontend/src/components/charts/OverdueTasksChart.tsx
- frontend/src/components/charts/TasksByDueDateChart.tsx
- frontend/src/App.tsx

## Files Created (2)
- frontend/src/pages/TechnicianProjectsPage.tsx
- frontend/src/pages/TechnicianTasksPage.tsx

## Next Steps
- None from frontend side -- all requirements implemented
