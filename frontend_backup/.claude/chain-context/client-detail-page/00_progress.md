# Task: Client Detail Page

## Goal
Replace modal-based client detail with a full `/clients/:id` page showing ALL related data.

## Status
- [x] Exploration complete (Naomi)
- [ ] Implementation (Nakamura)
- [ ] Verification

## Files to Create
- `src/views/ClientDetailPage.tsx` (NEW)

## Files to Modify
- `src/app/(protected)/[...slug]/page.tsx` — add `clients/:id` route
- `src/views/ClientsPage.tsx` — change row click from modal to router.push
- `src/types/index.ts` — add ClientWithProjects type (optional, or inline cast)

## Done Criteria
- [ ] `/clients/:id` shows full client detail page (not modal)
- [ ] Clicking a client in ClientsPage navigates to that page
- [ ] Back button returns to /clients
- [ ] `npx tsc --noEmit` passes
