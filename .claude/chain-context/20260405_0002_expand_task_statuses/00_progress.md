---
task_id: "20260405_0002_expand_task_statuses"
created: "2026-04-05T14:00:00Z"
last_updated: "2026-04-05T14:30:00Z"
status: "complete"
current_agent: "sato"
---

# Task: Expand Task Statuses and Timer-Driven Status Changes

## User Request
Expand task statuses from 3 (to_do, working_on_it, done) to 5 (to_do, in_progress, working_on_it, review, done). Make timer start/stop drive working_on_it/in_progress transitions.

## Tasks

## In Progress

## Completed
- [x] 1. Update schema.sql CHECK constraint (agent: sato)
- [x] 2. Update types/index.ts TaskStatus type (agent: sato)
- [x] 3. Update tasks.ts VALID_STATUSES and STATUS_TRANSITIONS (agent: sato)
- [x] 4. Update activities.ts timer start: accept to_do/in_progress -> working_on_it, reject review/done (agent: sato)
- [x] 5. Update activities.ts timer stop: set status to in_progress (agent: sato)
- [x] 6. Update activities.ts auto-pause (switch task): set paused task to in_progress (agent: sato)
- [x] 7. Update dashboard.ts: add in_progress/review counts to all chart queries (agent: sato)
- [x] 8. Update dashboard.ts: technician dashboard in_progress/review counts (agent: sato)
- [x] 9. Update spiCalculator.ts: overtime = working_on_it + in_progress (agent: sato)
- [x] 10. Update users.ts: working/overtime counts include in_progress (agent: sato)
- [x] 11. Update seed.sql: all working_on_it tasks -> in_progress (no active timers in seed) (agent: sato)
- [x] 12. Run tsc --noEmit -- PASS (0 errors) (agent: sato)

## Blockers
None

## Key Decisions
- working_on_it is EXCLUSIVELY set by timer start. Manual status dropdown should NOT include it.
- Timer stop always sets status to in_progress (paused state).
- Auto-pause on task switch also sets paused task to in_progress.
- Timer start rejects review/done tasks with 400 error.
- Overtime computed from both working_on_it AND in_progress (both mean "started but not done").
- Over deadline remains: to_do AND due_date < today.
- SPI: only 'done' counts as completed. All other statuses are "not done".
- Seed data: all working_on_it -> in_progress because seed is static (no is_tracking=true).
