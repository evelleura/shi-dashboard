---
task_id: "20260406_0001_nextjs_migration"
created: "2026-04-06T00:00:00Z"
last_updated: "2026-04-06T10:45:00Z"
status: "in_progress"
current_agent: "yamamoto"
---

# Task: Migrate Express + Vite/React to Next.js

## User Request
Thesis requires Next.js. Migrate everything into frontend/ directory using Next.js App Router.

## Architecture Change
FROM: server/ (Express 5 + TypeScript) + frontend/ (Vite + React 19)
TO:   frontend/ (Next.js 15 + App Router + API Routes + React 19)

## Tasks
- [x] Phase 1: EXPLORE -- Inventory all Express routes, React pages, shared code (agent: yamamoto)
- [x] Phase 2: STRATEGY -- Design Next.js structure, migration plan (agent: yamamoto)
- [ ] Phase 3: IMPLEMENT -- Create Next.js app, migrate API routes, migrate pages
- [ ] Phase 4: VERIFY -- TypeScript compilation, test all features
- [ ] Phase 5: CLEANUP -- Remove server/ directory, update run.py

## In Progress
Strategy complete. Awaiting Phase 3 implementation.

## Completed
- [x] Full codebase read: 12 route files, 57+ API endpoints, 31 components, 11 pages, 9 hooks (agent: yamamoto)
- [x] Migration strategy document (1234 lines) written to 01_yamamoto_strategy.md (agent: yamamoto)
  - App Router structure with flat layout (no route groups)
  - Complete 63-endpoint mapping table (Express -> Next.js route handlers)
  - Dependency analysis (keep/add/remove with exact package.json)
  - 3-layer auth pattern (middleware, API helper, client-side)
  - Database connection with globalThis singleton for HMR safety
  - File upload replacement (multer -> Web FormData API)
  - 5-phase migration order with dependency sequencing
  - Risk assessment (5 risks with mitigations)
  - Conversion cheat sheets (Express->Next.js, react-router->next/navigation)

## Blockers
None

## Key Decisions
- Research only for this phase -- no code changes
- Flat page structure (no route groups) -- matches current URL paths, existing Layout handles role-based nav
- Keep localStorage auth (not cookies) -- avoid scope creep
- Keep axios client unchanged (baseURL /api works same-origin)
- Web FormData API for uploads (not busboy) -- simpler, sufficient for 10MB limit
- All 31 components + 9 hooks transfer with zero changes
