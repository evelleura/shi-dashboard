---
task_id: "20260404_0001_dashboard_rewrite"
created: "2026-04-04T02:00:00Z"
last_updated: "2026-04-04T03:30:00Z"
status: "in_progress"
current_agent: "yamamoto"
---

# Task: Rewrite SHI Dashboard to Match Thesis + User Stories

## User Request
Rewrite the app to follow docs/user-story/user-stories.md and thesis document (naskah/Naskah TA 12-03-26-bak.docx).
Reference implementation: D:\__CODING\05-MyProjects\__TOOLING\workbench_tools\__tools\task15-daily-task-planner
Goal: Dashboard for project management with all charts and metrics needed.

## Tasks
- [x] Phase 1: EXPLORE -- Read thesis, user stories, reference app, current codebase
- [x] Phase 2: STRATEGIZE -- Design rewrite approach, data model, architecture
- [ ] Phase 3: VALIDATE -- Security, quality, build review of plan
- [ ] Phase 4: IMPLEMENT -- Backend rewrite (schema, API, SPI engine)
- [ ] Phase 5: IMPLEMENT -- Frontend rewrite (dashboard, forms, charts)
- [ ] Phase 6: VERIFY -- Integration test, deliver

## In Progress
(returning to tanaka for Phase 3: VALIDATE)

## Completed
- [x] User stories extraction + requirements analysis (agent: naomi, file: 02_naomi_user_stories.md)
- [x] Reference app exploration + pattern extraction (agent: naomi, file: 03_naomi_reference_app.md)
- [x] Current codebase full analysis (agent: naomi, file: 04_naomi_current_codebase.md)
- [x] Thesis document full requirements extraction (agent: naomi, file: 01_naomi_thesis.md)
- [x] Complete rewrite strategy designed (agent: yamamoto, file: 05_yamamoto_strategy.md)

## Blockers
- (resolved) Thesis RTF parsed successfully via Python state-machine extractor

## Key Decisions
- CONFLICT FOUND: User stories describe task-evidence model, NOT daily-report model (CLAUDE.md needs update)
- CONFLICT FOUND: Manager has full CRUD, NOT read-only (CLAUDE.md needs update)
- CONFLICT FOUND: Client entity required but missing from CLAUDE.md data model
- CONFLICT: Thesis says Next.js; CLAUDE.md says Vite+React+TanStack Query -- go with CLAUDE.md
- CONFLICT: SPI thresholds differ between thesis (SPI<1 = behind) and CLAUDE.md (0.95/0.85 bands) -- use 3-tier bands
- UI Reference: Monday.com (primary, 3/4 images), Zoho Projects (secondary, analytics dashboard)
- CODEBASE VERDICT: Backend/frontend patterns are solid (KEEP auth, SPI core, TanStack hooks), but 7 critical feature gaps found vs user stories
- Thesis Chapters 4-5 are EMPTY STUBS -- no ERD, wireframes, or class diagrams available; must design from scratch
- 9 functional requirements extracted, 7 entities identified, 18 visualization components specified
- STRATEGY DECISION: SPI primary source = task completion ratio (completed_tasks/total_tasks), fallback to daily_reports for legacy projects
- STRATEGY DECISION: Keep daily_reports table for thesis compliance, but tasks are the primary progress model
- STRATEGY DECISION: Additive migration (no DROP, no data loss), existing data survives
- STRATEGY DECISION: 8 new DB tables/modifications, 52 API endpoints (37 new), 46 new frontend files
- STRATEGY DECISION: Backend-first implementation order (schema -> SPI -> routes -> frontend)
- STRATEGY DECISION: Earned value chart computed on read (no snapshot table needed for thesis scope)
- STRATEGY DECISION: Click-to-change task status (not drag-and-drop) for Kanban -- simpler for thesis
