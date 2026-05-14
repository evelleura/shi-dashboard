# Naomi Exploration Findings

## Task 1: Play Button — 3 locations
- `frontend/src/components/tasks/TaskTimer.tsx` lines 64-88 (standalone timer component, custom SVG)
- `frontend/src/components/tasks/KanbanCard.tsx` lines 64-88 (card-level play/pause)
- `frontend/src/components/tasks/TaskTable.tsx` lines 261-285 (table column play/pause)
All use identical custom SVG (triangle/rectangles), no library imports.

## Task 2: Kanban DnD — Flow
- Library: `@dnd-kit/core` + `@dnd-kit/sortable`
- `KanbanBoard.tsx` lines 181-204: `handleDragEnd`
- COLUMN_TO_STATUS mapping lines 36-43:
  - `overtime` → 'working_on_it' (computed column)
  - `over_deadline` → 'to_do' (computed column)
  - `in_progress` → 'in_progress' (POSSIBLE MISMATCH with backend)
- Status mutation: `onStatusChange(id, status)` → hook → PATCH /api/tasks/:id/status
- Backend: tasks.ts lines 371-450, UPDATE tasks SET status=$1, updated_at=NOW()

## Task 3: Status Tracking — Gaps
- tasks table has: `timer_started_at`, `time_spent_seconds`, `is_tracking` (for play button timer)
- tasks table MISSING: `status_changed_at` timestamp
- audit_log EXISTS (schema lines 307-323): captures entity_type='task', action='status_change', old_value, new_value, changed_by, created_at
- task_activities EXISTS (lines 239-257): manual field notes, NOT auto-triggered on status change
- NO dedicated task_status_history table

## Schema file
`frontend/database/schema.sql` — tasks table is lines 98-135
