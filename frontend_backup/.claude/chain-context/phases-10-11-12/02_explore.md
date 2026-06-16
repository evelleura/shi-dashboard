# Naomi Exploration Results — Phases 10-11-12

## Phase 10: Survey Phase Flow
- Backend: approveSurvey + rejectSurvey in handlers/projects.ts (lines 286-360) ✅
- API routes: POST /projects/:id/approve-survey and /reject-survey ✅
- Services: approveSurvey, rejectSurvey in api.ts ✅
- Hooks: useApproveSurvey, useRejectSurvey in hooks/useProjects.ts (lines 103-120) ✅
- DB columns: phase, survey_approved, survey_approved_by, survey_approved_at, is_survey_task ✅
- MISSING: UI buttons in ProjectDetailPage.tsx (~line 168/175 header area)
  - Show when phase='survey' && survey_approved=false
  - Manager/Admin only
  - Approve button → useApproveSurvey
  - Reject button → useRejectSurvey (accepts optional reason)
- MISSING: TaskForm UI for is_survey_task checkbox (CreateTaskData has field, no UI)
- Types: ProjectPhase = 'survey'|'execution', Project has phase/survey_approved fields

## Phase 11: Global Search
- FULLY IMPLEMENTED — GlobalSearchBar.tsx exists, integrated in Layout.tsx ✅

## Phase 12: Gantt View
- FULLY IMPLEMENTED — SchedulePage.tsx has full Gantt + Calendar toggle ✅
- Bug fixed: tasks.depends_on column was missing from DB — migration run 2026-04-26

## Only work needed:
1. ProjectDetailPage.tsx: Add approve/reject survey buttons in header when phase='survey'
2. TaskForm.tsx: Add is_survey_task checkbox (optional enhancement)
