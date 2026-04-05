---
task_id: "20260405_0002_expanded_task_statuses"
created: "2026-04-05T14:00:00Z"
last_updated: "2026-04-05T14:30:00Z"
status: "complete"
current_agent: "takahashi"
---

# Task: Update frontend for expanded task statuses (5 instead of 3)

## User Request
Update all frontend components to support 5 task statuses (to_do, in_progress, working_on_it, review, done) instead of the previous 3 (to_do, working_on_it, done).

## Tasks

## In Progress

## Completed
- [x] 1. Update TaskStatus type to include in_progress and review (agent: takahashi)
- [x] 2. Update TechnicianDashboardData.my_tasks to include in_progress and review counts (agent: takahashi)
- [x] 3. Update DashboardSummary to include in_progress_tasks and review_tasks (agent: takahashi)
- [x] 4. Update TasksByDueDateData and TasksByOwnerData types (agent: takahashi)
- [x] 5. Rewrite TaskStatusSelect with 5 statuses, role-based visibility, pulsing dot for working_on_it (agent: takahashi)
- [x] 6. Rewrite KanbanBoard with 6 columns: To Do, In Progress (merged in_progress+working_on_it), Review, Done, Overtime, Over Deadline (agent: takahashi)
- [x] 7. Update KanbanCard with review status purple border styling (agent: takahashi)
- [x] 8. Update TaskTable with correct sort order, urgency logic for in_progress, review row bg (agent: takahashi)
- [x] 9. Update TaskDetailModal with corrected overtime logic and "Submit for Review" quick action button (agent: takahashi)
- [x] 10. Update TasksByStatusChart with in_progress and review colors/labels (agent: takahashi)
- [x] 11. Update TasksByDueDateChart with in_progress and review bars (agent: takahashi)
- [x] 12. Update TasksByOwnerChart with in_progress and review bars (agent: takahashi)
- [x] 13. Update SummaryStatsCards with In Progress and Review cards (agent: takahashi)
- [x] 14. Update SummaryCards with In Progress and Review cards (agent: takahashi)
- [x] 15. Update TechnicianDashboard stat cards, pie chart, and grid layout for new statuses (agent: takahashi)
- [x] 16. Run tsc --noEmit -- PASS (0 errors) (agent: takahashi)

## Blockers
None

## Key Decisions
- KanbanBoard: Merged in_progress + working_on_it into single "In Progress" column (6 columns total) to keep screen manageable. working_on_it cards distinguished by pulsing green dot.
- TaskStatusSelect: Technicians see to_do/in_progress/review only. working_on_it is timer-only. done is manager-only.
- Color scheme: in_progress=blue, working_on_it=green (with pulse), review=purple, done=emerald
- "Submit for Review" button added to TaskDetailModal for technicians when task is in_progress or working_on_it
- Overtime computation now includes both in_progress and working_on_it tasks that are overdue
