---
task_id: "20260404_0001_dashboard_rewrite"
agent: "sato"
phase: "implementation"
status: "COMPLETE"
timestamp: "2026-04-04T07:00:00Z"
---

# Context: Sato - Remove 'stuck' task status, replace with computed overtime/over_deadline

## Work Done

Removed the manual 'stuck' task status from the entire backend. Task statuses are now: to_do, working_on_it, done (3 only).

Overtime and over_deadline are computed concepts:
- **Overtime**: status = 'working_on_it' AND due_date < CURRENT_DATE
- **Over Deadline**: status = 'to_do' AND due_date < CURRENT_DATE

### Files Modified (8 files)

1. **server/database/schema.sql**: Removed 'stuck' from task_status_check constraint. Renamed stuck_tasks to overtime_tasks in project_health table.

2. **server/src/types/index.ts**: TaskStatus reduced to 3 values. All interfaces updated: stuck_tasks -> overtime_tasks, TasksByOwnerData.stuck -> overtime, TasksByDueDateData.stuck removed, OverdueTasksData.overdue_stuck -> overdue_todo.

3. **server/src/services/spiCalculator.ts**: getTaskCounts() now counts overtime (working_on_it + past due) instead of stuck. Upsert query uses overtime_tasks column.

4. **server/src/routes/tasks.ts**: VALID_STATUSES reduced to 3. STATUS_TRANSITIONS updated: working_on_it can go back to to_do (replaces stuck transition), stuck entries removed entirely.

5. **server/src/routes/dashboard.ts**: All stuck counting replaced with overtime counting. Technician dashboard now includes overtime + over_deadline counts. Tasks-by-status ORDER BY updated. Tasks-by-owner and tasks-by-due-date charts updated.

6. **server/src/routes/projects.ts**: ph.stuck_tasks -> ph.overtime_tasks in all SELECT queries.

7. **server/src/routes/users.ts**: my_stuck_tasks -> my_overtime_tasks with computed filter (working_on_it + past due).

8. **server/database/seed.sql**: All 'stuck' task statuses changed to 'working_on_it'. Project health seed data updated with overtime_tasks column and adjusted counts. Comments updated.

### NOT Modified
- **server/database/migration.sql**: Historical migration file left untouched. schema.sql is canonical for fresh installs.
- **Daily report text**: "Gateway IoT stuck" and "Smart curtain motor stuck" are real-world descriptions, not status values.

## Verification
- `tsc --noEmit` passes with 0 errors
- No remaining 'stuck' references in source code (only in migration.sql history and daily report text content)

## Next Steps
- Frontend needs corresponding updates (types, Kanban columns, chart components)
