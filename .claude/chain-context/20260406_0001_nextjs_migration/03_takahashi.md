---
task_id: "20260406_0001_nextjs_migration"
agent: "takahashi"
phase: "implementation"
status: "COMPLETE"
timestamp: "2026-04-06T15:00:00Z"
---

# Context: Takahashi -- Phase 3b Page Migration

## Work Done

### react-router-dom Removal (10 files affected)
Replaced all react-router-dom imports with Next.js equivalents:

| react-router-dom | Next.js | Files affected |
|-----------------|---------|----------------|
| `useNavigate()` | `useRouter()` from `next/navigation` | LandingPage, LoginPage, DashboardPage, ProjectsPage, ProjectDetailPage, TechnicianDashboard, TechnicianProjectsPage, Layout.tsx |
| `useParams()` | `useParams()` from `next/navigation` | ProjectDetailPage |
| `NavLink` | `Link` from `next/link` + `usePathname()` | Layout.tsx |
| `Link to=` | `Link href=` from `next/link` | ProjectsPage, ProjectCard.tsx |
| `navigate('/path')` | `router.push('/path')` | 7 page components |
| `navigate(-1)` | `router.back()` | ProjectDetailPage |

### App Router Structure Created

```
src/app/
  layout.tsx              -- Root layout (html/body + Providers)
  providers.tsx           -- QueryClientProvider (client component)
  page.tsx                -- Landing (public, redirects authenticated users)
  login/page.tsx          -- Login (public)
  (protected)/
    layout.tsx            -- Auth guard + Layout sidebar wrapper
    dashboard/page.tsx    -- Manager dashboard
    projects/page.tsx     -- Projects list
    projects/[id]/page.tsx -- Project detail
    clients/page.tsx      -- Clients management
    escalations/page.tsx  -- Escalation management
    my-dashboard/page.tsx -- Technician dashboard
    my-projects/page.tsx  -- Technician projects
    my-tasks/page.tsx     -- Technician tasks
    my-escalations/page.tsx -- Technician escalations
```

### Files Deleted
- src/App.tsx (replaced by app/ directory routing)
- src/main.tsx (replaced by app/layout.tsx)
- src/index.css (replaced by app/globals.css)

### Files Renamed
- src/pages/ -> src/views/ (Pages Router conflict avoidance)

### Critical Fix: SSR Safety
- useAuth.ts: Added `typeof window === 'undefined'` guard to useState initializers
  that read localStorage. Without this, Next.js pre-rendering crashes with
  `ReferenceError: localStorage is not defined`.

### LoginPage Props Change
- Removed `onLogin: () => void` prop from LoginPage (was used by App.tsx forceUpdate pattern)
- No longer needed since Next.js handles routing independently

## Verification
- `tsc --noEmit`: 0 errors
- `next build`: SUCCESS (38 static pages + 50+ API routes)
- No react-router-dom references in source code
- No react-router-dom in package.json or node_modules

## Next Steps
- Phase 4: Manual testing of each page and auth flow
- Phase 5: Remove server/ directory, update run.py
