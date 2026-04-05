---
task_id: "20260405_0002_expand_task_statuses"
agent: "sato"
phase: "implementation"
status: "COMPLETE"
timestamp: "2026-04-05T14:30:00Z"
---

# Context: Sato - Implementation

## Work Done

Expanded task statuses from 3 to 5 and wired timer start/stop to drive status transitions.

### Files Modified (10 files)

**Schema:**
- `server/database/schema.sql` - CHECK constraint: added in_progress, review

**Types:**
- `server/src/types/index.ts` - TaskStatus union: added in_progress, review

**Routes:**
- `server/src/routes/tasks.ts` - VALID_STATUSES (5 values), STATUS_TRANSITIONS (new flow: to_do->in_progress->review, working_on_it->in_progress, review->in_progress, done=locked)
- `server/src/routes/activities.ts` - Timer start: accepts to_do/in_progress->working_on_it, rejects review/done. Timer stop: sets in_progress. Auto-pause: sets in_progress.
- `server/src/routes/dashboard.ts` - All 5 chart queries + technician dashboard: added in_progress/review counts, overtime includes in_progress
- `server/src/routes/users.ts` - my_working_tasks/my_overtime_tasks include in_progress
- `server/src/routes/projects.ts` - No changes needed (relies on project_health table)

**Services:**
- `server/src/services/spiCalculator.ts` - working count = working_on_it + in_progress, overtime = same + due_date past

**Seed:**
- `server/database/seed.sql` - All 28 working_on_it task inserts changed to in_progress (seed has no active timers)

### Status Flow (Technician)
```
to_do --[manual]--> in_progress --[timer start]--> working_on_it --[timer stop]--> in_progress --[manual]--> review
                                                                                                              |
                                                                     review --[manual]--> in_progress        |
                                                                     done --[manager only]-->                 v
```

### Validation
- tsc --noEmit: 0 errors
- No frontend files touched
- SPI still uses only 'done' as completed

## Next Steps
- Frontend needs updating to display new statuses (separate task, not in scope)
