---
task_id: "20260406_0001_nextjs_migration"
agent: "yamamoto"
phase: "exploration"
status: "COMPLETE"
timestamp: "2026-04-06T10:30:00Z"
---

# Next.js App Router Migration Strategy

## Executive Summary

Migrate from a two-process architecture (Express 5 backend on port 3000 + Vite/React 19 frontend on port 5173 with proxy) to a single Next.js 15 application with App Router. The backend logic moves into Next.js Route Handlers (`app/api/`), the frontend pages move into App Router pages (`app/`), and all React components, hooks, and types transfer unchanged.

**Scope:** 12 Express route files containing 57 API endpoints, 11 React pages, 31 components, 9 hooks, 1 shared types file, 1 service module (SPI calculator). The database layer (PostgreSQL via `pg`) and all business logic remain identical.

**Risk assessment:** MEDIUM. The migration is structurally mechanical -- same React components, same SQL queries, same TypeScript types. The three areas requiring careful attention are: (1) multer file upload replacement, (2) auth middleware conversion from Express chain to helper-function pattern, and (3) the Vite proxy removal since API routes become same-origin.

---

## 1. Next.js App Router Structure

### 1.1 Directory Layout

```
frontend/
  app/
    layout.tsx                          -- Root layout (QueryClientProvider, global styles)
    page.tsx                            -- Landing page (public)
    login/
      page.tsx                          -- Login page (public)
    (manager)/                          -- Route group for manager/admin pages
      layout.tsx                        -- Layout with sidebar (manager nav)
      dashboard/
        page.tsx                        -- DashboardPage
      projects/
        page.tsx                        -- ProjectsPage
        [id]/
          page.tsx                      -- ProjectDetailPage
      clients/
        page.tsx                        -- ClientsPage
      escalations/
        page.tsx                        -- EscalationsPage
    (technician)/                       -- Route group for technician pages
      layout.tsx                        -- Layout with sidebar (technician nav)
      my-dashboard/
        page.tsx                        -- TechnicianDashboard
      my-projects/
        page.tsx                        -- TechnicianProjectsPage
      my-tasks/
        page.tsx                        -- TechnicianTasksPage
      my-escalations/
        page.tsx                        -- TechnicianEscalationsPage
    api/
      auth/
        login/route.ts                  -- POST
        register/route.ts               -- POST
      users/
        route.ts                        -- GET (list)
        me/route.ts                     -- GET
        me/projects/route.ts            -- GET
        technicians/route.ts            -- GET
      clients/
        route.ts                        -- GET (list), POST
        [id]/route.ts                   -- GET, PATCH, DELETE
      projects/
        route.ts                        -- GET (list), POST
        [id]/
          route.ts                      -- GET, PATCH, DELETE
          assignments/
            route.ts                    -- GET, POST
            [userId]/route.ts           -- DELETE
          auto-assign/route.ts          -- POST
          approve-survey/route.ts       -- POST
          reject-survey/route.ts        -- POST
      tasks/
        route.ts                        -- POST (create single)
        bulk/route.ts                   -- POST (bulk create)
        [id]/
          route.ts                      -- GET, PATCH, DELETE
          status/route.ts               -- PATCH
          reorder/route.ts              -- POST
        project/
          [projectId]/route.ts          -- GET (tasks by project)
      evidence/
        upload/route.ts                 -- POST
        [id]/
          download/route.ts             -- GET
          route.ts                      -- DELETE
        task/
          [taskId]/route.ts             -- GET (evidence by task)
      materials/
        route.ts                        -- POST
        [id]/route.ts                   -- PATCH, DELETE
        project/
          [projectId]/route.ts          -- GET
      budget/
        route.ts                        -- POST
        [id]/route.ts                   -- PATCH, DELETE
        project/
          [projectId]/route.ts          -- GET
      activities/
        route.ts                        -- POST (create with file)
        my/today/route.ts               -- GET
        task/
          [taskId]/
            route.ts                    -- GET (activities by task)
            timer/
              start/route.ts            -- POST
              stop/route.ts             -- POST
      escalations/
        route.ts                        -- GET (list), POST (create)
        summary/route.ts                -- GET
        [id]/
          route.ts                      -- GET
          review/route.ts               -- PATCH
          resolve/route.ts              -- PATCH
      daily-reports/
        route.ts                        -- GET, POST
      dashboard/
        route.ts                        -- GET (main dashboard)
        technician/route.ts             -- GET
        charts/
          tasks-by-status/route.ts      -- GET
          tasks-by-owner/route.ts       -- GET
          overdue-tasks/route.ts        -- GET
          tasks-by-due-date/route.ts    -- GET
          budget-status/route.ts        -- GET
          earned-value/
            [projectId]/route.ts        -- GET
    not-found.tsx                        -- 404 page
  components/                           -- UNCHANGED from current frontend/src/components/
    charts/
    tasks/
    projects/
    evidence/
    dashboard/
    ui/
  hooks/                                -- UNCHANGED from current frontend/src/hooks/
  services/
    api.ts                              -- Axios client (baseURL changes, see section 3)
  types/
    index.ts                            -- UNCHANGED
  lib/
    db.ts                               -- pg Pool singleton (moved from server/src/utils/)
    auth.ts                             -- JWT verify helper (moved from server/src/middleware/)
    spiCalculator.ts                    -- SPI service (moved from server/src/services/)
  middleware.ts                          -- Next.js middleware for route protection
  next.config.ts                        -- Next.js configuration
  tailwind.config.ts                    -- Tailwind configuration (may not be needed with v4)
  postcss.config.mjs                    -- PostCSS configuration
  tsconfig.json                         -- TypeScript configuration (adjusted for Next.js)
  public/
    uploads/                            -- Static uploads directory (or use custom handler)
```

### 1.2 Route Groups Explanation

The `(manager)` and `(technician)` route groups are organizational only -- they do NOT affect URL paths. A user hitting `/dashboard` still gets the dashboard page. The groups allow separate layouts with different sidebars.

**Alternative approach:** Use a single layout with dynamic sidebar based on user role (simpler). The current `Layout.tsx` already does role-based nav. If keeping the existing pattern, skip route groups entirely:

```
app/
  layout.tsx              -- Contains <Layout> wrapper with auth check
  dashboard/page.tsx
  projects/page.tsx
  projects/[id]/page.tsx
  clients/page.tsx
  escalations/page.tsx
  my-dashboard/page.tsx
  my-projects/page.tsx
  my-tasks/page.tsx
  my-escalations/page.tsx
```

**Recommendation:** Use the flat approach (no route groups). It matches the current URL structure exactly and the Layout component already handles role-based rendering. Route groups add complexity without benefit here.

### 1.3 Client vs Server Components

All existing page components use TanStack Query hooks and browser APIs (localStorage). They MUST remain Client Components.

```tsx
// app/dashboard/page.tsx
'use client';

import DashboardPage from '@/components/pages/DashboardPage';  // existing page
export default function Page() {
  return <DashboardPage />;
}
```

Or, rename the existing page files directly. Either way, every page file needs `'use client'` at the top because they all use:
- `useState`, `useEffect` (React hooks)
- `useQuery`, `useMutation` (TanStack Query)
- `localStorage` (token storage)
- `window.location` (redirect on 401)

The Layout component also needs `'use client'` because it reads `localStorage` for user role.

**Server Components opportunity:** The landing page (`LandingPage`) and login page could potentially be Server Components if they don't use client-side state, but given the login form needs `useState`, it would need `'use client'` anyway. Keep everything client-side for this migration -- optimization to Server Components can come later.

---

## 2. API Routes Migration -- Complete Endpoint Mapping

### 2.1 Pattern Translation

**Express pattern:**
```typescript
router.get('/', authenticate, authorize('manager', 'admin'), async (req, res) => {
  // handler
});
```

**Next.js pattern:**
```typescript
// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (authResult.error) return authResult.error;

  const roleCheck = authorizeRoles(authResult.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  // ... same SQL logic ...
  return NextResponse.json({ success: true, data: result.rows });
}
```

### 2.2 Complete Endpoint Map (57 endpoints)

| # | Method | Express Route | Next.js Route Handler File | Auth | Roles |
|---|--------|---------------|---------------------------|------|-------|
| **Auth (2)** |
| 1 | POST | `/api/auth/login` | `api/auth/login/route.ts` | None | Public |
| 2 | POST | `/api/auth/register` | `api/auth/register/route.ts` | None | Public |
| **Users (4)** |
| 3 | GET | `/api/users/me` | `api/users/me/route.ts` | Yes | Any |
| 4 | GET | `/api/users` | `api/users/route.ts` | Yes | manager, admin |
| 5 | GET | `/api/users/technicians` | `api/users/technicians/route.ts` | Yes | manager, admin |
| 6 | GET | `/api/users/me/projects` | `api/users/me/projects/route.ts` | Yes | technician |
| **Clients (5)** |
| 7 | GET | `/api/clients` | `api/clients/route.ts` | Yes | manager, admin |
| 8 | GET | `/api/clients/:id` | `api/clients/[id]/route.ts` | Yes | manager, admin |
| 9 | POST | `/api/clients` | `api/clients/route.ts` | Yes | manager, admin |
| 10 | PATCH | `/api/clients/:id` | `api/clients/[id]/route.ts` | Yes | manager, admin |
| 11 | DELETE | `/api/clients/:id` | `api/clients/[id]/route.ts` | Yes | admin |
| **Projects (10)** |
| 12 | GET | `/api/projects` | `api/projects/route.ts` | Yes | Any |
| 13 | GET | `/api/projects/:id` | `api/projects/[id]/route.ts` | Yes | Any |
| 14 | POST | `/api/projects` | `api/projects/route.ts` | Yes | manager, admin |
| 15 | PATCH | `/api/projects/:id` | `api/projects/[id]/route.ts` | Yes | manager, admin |
| 16 | DELETE | `/api/projects/:id` | `api/projects/[id]/route.ts` | Yes | admin |
| 17 | GET | `/api/projects/:id/assignments` | `api/projects/[id]/assignments/route.ts` | Yes | manager, admin |
| 18 | POST | `/api/projects/:id/assignments` | `api/projects/[id]/assignments/route.ts` | Yes | manager, admin |
| 19 | DELETE | `/api/projects/:id/assignments/:userId` | `api/projects/[id]/assignments/[userId]/route.ts` | Yes | manager, admin |
| 20 | POST | `/api/projects/:id/auto-assign` | `api/projects/[id]/auto-assign/route.ts` | Yes | manager, admin |
| 21 | POST | `/api/projects/:id/approve-survey` | `api/projects/[id]/approve-survey/route.ts` | Yes | manager, admin |
| 22 | POST | `/api/projects/:id/reject-survey` | `api/projects/[id]/reject-survey/route.ts` | Yes | manager, admin |
| **Tasks (8)** |
| 23 | GET | `/api/tasks/project/:projectId` | `api/tasks/project/[projectId]/route.ts` | Yes | Any |
| 24 | GET | `/api/tasks/:id` | `api/tasks/[id]/route.ts` | Yes | Any |
| 25 | POST | `/api/tasks` | `api/tasks/route.ts` | Yes | manager, admin |
| 26 | POST | `/api/tasks/bulk` | `api/tasks/bulk/route.ts` | Yes | manager, admin |
| 27 | PATCH | `/api/tasks/:id` | `api/tasks/[id]/route.ts` | Yes | manager, admin |
| 28 | PATCH | `/api/tasks/:id/status` | `api/tasks/[id]/status/route.ts` | Yes | Any |
| 29 | POST | `/api/tasks/:id/reorder` | `api/tasks/[id]/reorder/route.ts` | Yes | manager, admin |
| 30 | DELETE | `/api/tasks/:id` | `api/tasks/[id]/route.ts` | Yes | manager, admin |
| **Evidence (4)** |
| 31 | POST | `/api/evidence/upload` | `api/evidence/upload/route.ts` | Yes | Any |
| 32 | GET | `/api/evidence/task/:taskId` | `api/evidence/task/[taskId]/route.ts` | Yes | Any |
| 33 | GET | `/api/evidence/:id/download` | `api/evidence/[id]/download/route.ts` | Yes | Any |
| 34 | DELETE | `/api/evidence/:id` | `api/evidence/[id]/route.ts` | Yes | manager, admin |
| **Materials (4)** |
| 35 | GET | `/api/materials/project/:projectId` | `api/materials/project/[projectId]/route.ts` | Yes | Any |
| 36 | POST | `/api/materials` | `api/materials/route.ts` | Yes | manager, admin |
| 37 | PATCH | `/api/materials/:id` | `api/materials/[id]/route.ts` | Yes | manager, admin |
| 38 | DELETE | `/api/materials/:id` | `api/materials/[id]/route.ts` | Yes | manager, admin |
| **Budget (4)** |
| 39 | GET | `/api/budget/project/:projectId` | `api/budget/project/[projectId]/route.ts` | Yes | Any |
| 40 | POST | `/api/budget` | `api/budget/route.ts` | Yes | manager, admin |
| 41 | PATCH | `/api/budget/:id` | `api/budget/[id]/route.ts` | Yes | manager, admin |
| 42 | DELETE | `/api/budget/:id` | `api/budget/[id]/route.ts` | Yes | manager, admin |
| **Activities (5)** |
| 43 | GET | `/api/activities/task/:taskId` | `api/activities/task/[taskId]/route.ts` | Yes | Any |
| 44 | POST | `/api/activities` | `api/activities/route.ts` | Yes | Any |
| 45 | POST | `/api/activities/task/:taskId/timer/start` | `api/activities/task/[taskId]/timer/start/route.ts` | Yes | Any |
| 46 | POST | `/api/activities/task/:taskId/timer/stop` | `api/activities/task/[taskId]/timer/stop/route.ts` | Yes | Any |
| 47 | GET | `/api/activities/my/today` | `api/activities/my/today/route.ts` | Yes | Any |
| **Escalations (6)** |
| 48 | GET | `/api/escalations` | `api/escalations/route.ts` | Yes | Any |
| 49 | POST | `/api/escalations` | `api/escalations/route.ts` | Yes | Any |
| 50 | GET | `/api/escalations/summary` | `api/escalations/summary/route.ts` | Yes | Any |
| 51 | GET | `/api/escalations/:id` | `api/escalations/[id]/route.ts` | Yes | Any |
| 52 | PATCH | `/api/escalations/:id/review` | `api/escalations/[id]/review/route.ts` | Yes | manager, admin |
| 53 | PATCH | `/api/escalations/:id/resolve` | `api/escalations/[id]/resolve/route.ts` | Yes | manager, admin |
| **Dashboard (8)** |
| 54 | GET | `/api/dashboard` | `api/dashboard/route.ts` | Yes | manager, admin |
| 55 | GET | `/api/dashboard/technician` | `api/dashboard/technician/route.ts` | Yes | Any |
| 56 | GET | `/api/dashboard/charts/tasks-by-status` | `api/dashboard/charts/tasks-by-status/route.ts` | Yes | manager, admin |
| 57 | GET | `/api/dashboard/charts/tasks-by-owner` | `api/dashboard/charts/tasks-by-owner/route.ts` | Yes | manager, admin |
| 58 | GET | `/api/dashboard/charts/overdue-tasks` | `api/dashboard/charts/overdue-tasks/route.ts` | Yes | manager, admin |
| 59 | GET | `/api/dashboard/charts/tasks-by-due-date` | `api/dashboard/charts/tasks-by-due-date/route.ts` | Yes | manager, admin |
| 60 | GET | `/api/dashboard/charts/budget-status` | `api/dashboard/charts/budget-status/route.ts` | Yes | manager, admin |
| 61 | GET | `/api/dashboard/charts/earned-value/:projectId` | `api/dashboard/charts/earned-value/[projectId]/route.ts` | Yes | Any |
| **Daily Reports (2)** |
| 62 | POST | `/api/daily-reports` | `api/daily-reports/route.ts` | Yes | technician, admin |
| 63 | GET | `/api/daily-reports` | `api/daily-reports/route.ts` | Yes | Any |

**Total: 63 endpoints** across 42 route handler files.

### 2.3 Route Handler Template

Every route handler follows this pattern:

```typescript
// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  // 1. Auth check
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  // 2. Role check (optional)
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  // 3. Business logic (IDENTICAL to Express handler body)
  try {
    const result = await query(`SELECT ... FROM clients ...`);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get clients error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  // ... same logic ...
}
```

### 2.4 Dynamic Route Parameters

Express `req.params.id` becomes Next.js route segment params:

```typescript
// app/api/projects/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid project ID' },
      { status: 400 }
    );
  }
  // ... rest identical ...
}
```

**Note:** In Next.js 15 App Router, `params` is now a Promise and must be awaited.

### 2.5 Query Parameters

Express `req.query` becomes `request.nextUrl.searchParams`:

```typescript
// GET /api/escalations?status=open&project_id=5
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const projectId = searchParams.get('project_id');
  // ... same logic ...
}
```

---

## 3. Dependencies

### 3.1 KEEP (move to single package.json)

From `frontend/package.json`:
- `@tanstack/react-query` ^5.90.21
- `react` ^19.2.4
- `react-dom` ^19.2.4
- `recharts` ^3.8.0
- `tailwindcss` ^4.2.1
- `@tailwindcss/postcss` ^4.2.1
- `postcss` ^8.5.8
- `autoprefixer` ^10.4.27
- `typescript` ^5.9.3
- `@types/react` ^19.2.14
- `@types/react-dom` ^19.2.3

From `server/package.json`:
- `pg` ^8.20.0
- `bcryptjs` ^3.0.3
- `jsonwebtoken` ^9.0.3
- `dotenv` ^17.3.1
- `@types/bcryptjs` ^2.4.6
- `@types/jsonwebtoken` ^9.0.10
- `@types/pg` ^8.18.0
- `@types/node` ^25.5.0

### 3.2 ADD

- `next` ^15.x (core framework)
- `@types/formidable` (if using formidable for uploads)
- `busboy` or `@types/busboy` (alternative upload parsing)

### 3.3 REMOVE

From `frontend/package.json`:
- `vite` ^8.0.0 -- replaced by Next.js
- `@vitejs/plugin-react` ^6.0.1 -- replaced by Next.js
- `react-router-dom` ^7.13.1 -- replaced by App Router file-based routing

From `server/package.json` (entire server/ directory goes away):
- `express` ^5.2.1 -- replaced by Next.js Route Handlers
- `cors` ^2.8.6 -- not needed (same-origin)
- `multer` ^1.4.5-lts.1 -- replaced by built-in Web API or busboy
- `nodemon` ^3.1.14 -- replaced by `next dev`
- `ts-node` ^10.9.2 -- replaced by Next.js built-in TypeScript
- `@types/express` ^5.0.6
- `@types/cors` ^2.8.19
- `@types/multer` ^1.4.12

### 3.4 CHANGE

- `axios` ^1.13.6 -- **KEEP but reconfigure**. The baseURL changes from `/api` (which was proxied by Vite) to `/api` (which is now same-origin). The Vite proxy configuration is no longer needed since API routes are served by the same Next.js server. The `axios.create({ baseURL: '/api' })` call remains identical -- it just works without a proxy now.

### 3.5 Resulting package.json (merged)

```json
{
  "name": "dian-shi-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:setup": "tsx database/setup.ts",
    "db:seed": "tsx database/setup.ts --seed"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.90.21",
    "axios": "^1.13.6",
    "bcryptjs": "^3.0.3",
    "dotenv": "^17.3.1",
    "jsonwebtoken": "^9.0.3",
    "next": "^15.x",
    "pg": "^8.20.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "recharts": "^3.8.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^25.5.0",
    "@types/pg": "^8.18.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "autoprefixer": "^10.4.27",
    "postcss": "^8.5.8",
    "tailwindcss": "^4.2.1",
    "typescript": "^5.9.3"
  }
}
```

---

## 4. Auth Pattern

### 4.1 Current Pattern (Express)

```
Client -> Bearer token in Authorization header
       -> authenticate middleware (verify JWT, attach req.user)
       -> authorize middleware (check role)
       -> handler
```

Token stored in `localStorage`, attached via axios interceptor.

### 4.2 Next.js Pattern

Three auth layers:

#### Layer 1: Next.js Middleware (Route Protection)

```typescript
// frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login'];

// Route -> required roles mapping
const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard': ['manager', 'admin'],
  '/projects': ['manager', 'admin'],
  '/clients': ['manager', 'admin'],
  '/escalations': ['manager', 'admin'],
  '/my-dashboard': ['technician', 'admin'],
  '/my-projects': ['technician', 'admin'],
  '/my-tasks': ['technician', 'admin'],
  '/my-escalations': ['technician', 'admin'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and public assets
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Public routes: no auth needed
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // For protected page routes: check cookie or redirect to login.
  // NOTE: Since current app uses localStorage (not cookies), the
  // middleware cannot verify auth. Two options:
  //
  // Option A (RECOMMENDED): Keep client-side auth checks as-is.
  //   The ProtectedRoute component already handles this.
  //   Middleware only handles simple redirects.
  //
  // Option B (FUTURE): Migrate to httpOnly cookie-based tokens.
  //   Then middleware can read the cookie and verify.
  //
  // For this migration: Use Option A. The middleware is a no-op
  // for page routes. Auth enforcement stays in the client via the
  // existing ProtectedRoute pattern (now in the layout).

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

#### Layer 2: API Route Auth Helper

```typescript
// frontend/lib/auth.ts
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

interface JwtPayload {
  userId: number;
  email: string;
  role: 'technician' | 'manager' | 'admin';
}

interface AuthResult {
  user: JwtPayload | null;
  errorResponse: NextResponse;
}

export function authenticateRequest(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;
    return {
      user: payload,
      errorResponse: null as never,
    };
  } catch {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}

export function authorizeRoles(
  user: JwtPayload,
  roles: string[]
): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied' },
      { status: 403 }
    );
  }
  return null; // authorized
}
```

#### Layer 3: Client-Side Auth (UNCHANGED)

The existing pattern stays:
- `localStorage.getItem('token')` for auth state
- axios interceptor attaches `Bearer` token to every request
- 401 response interceptor clears storage and redirects to `/login`
- `ProtectedRoute` component (now in root layout or a wrapper) checks role

The only change: `react-router-dom`'s `<Navigate>` becomes Next.js `redirect()` or `useRouter().push()`.

### 4.3 Token Storage Decision

**Current:** `localStorage` (token + user JSON)
**Recommendation for migration:** Keep `localStorage` for now. Changing to httpOnly cookies is a separate, orthogonal change that can happen later.

**Why not cookies now:**
- Scope creep -- adds a login flow rewrite
- Every API call currently sends Bearer header via axios interceptor
- Changing to cookies means changing the auth endpoint response format
- Does not affect thesis functionality

**Future consideration:** For production, httpOnly cookies are more secure (XSS-resistant). But that is a separate task.

---

## 5. Database Connection

### 5.1 Current Pattern

```typescript
// server/src/utils/db.ts
const pool = new Pool({ ... });
export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
```

### 5.2 Next.js Pattern

Move to `frontend/lib/db.ts` with the SAME code. The `pg` Pool singleton works correctly in Next.js API routes because:

1. In **production** (`next start`): Node.js runs a long-lived process. The pool is created once at module load and reused across all API route invocations. Identical to Express behavior.

2. In **development** (`next dev`): Hot Module Replacement (HMR) can re-execute module code, creating new pool instances. This is the only gotcha. Fix with the standard Next.js pattern:

```typescript
// frontend/lib/db.ts
import { Pool } from 'pg';

// Prevent multiple Pool instances during hot reload in development
const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

const pool = globalForPg.pgPool ?? new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shi_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = <T = unknown>(text: string, params?: unknown[]) =>
  pool.query<T & Record<string, unknown>>(text, params);

export const getClient = () => pool.connect();

export default pool;
```

### 5.3 Environment Variables

Next.js loads `.env.local` automatically. The current `.env` file works if renamed:

```
# .env.local (or .env -- Next.js loads both)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shi_dashboard
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=your-secret-key
```

**Important:** Variables used in API routes (server-side only) do NOT need the `NEXT_PUBLIC_` prefix. Only browser-accessible variables need that prefix. Since `DB_*` and `JWT_SECRET` are only used in route handlers, they remain as-is.

---

## 6. File Uploads

### 6.1 Current Pattern

Three routes use multer for file uploads:
1. `POST /api/evidence/upload` -- task evidence (photos, docs)
2. `POST /api/activities` -- activity with optional file
3. `POST /api/escalations` -- escalation with optional file

All three use `multer.diskStorage` with:
- Dynamic destination: `uploads/projects/{projectId}/tasks/{taskId}/` (or `/escalations/`, `/activities/`)
- Sanitized filenames: `{timestamp}_{sanitized_name}.{ext}`
- File size limit: 10MB
- MIME type validation (images, PDF, Word, Excel)
- File cleanup on error

### 6.2 Next.js Replacement

**Option A: Web API FormData (RECOMMENDED)**

Next.js Route Handlers can parse `multipart/form-data` using the native Web `Request.formData()` API:

```typescript
// app/api/evidence/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const taskId = formData.get('task_id') as string;
  const fileType = formData.get('file_type') as string;
  const description = formData.get('description') as string | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: 'No file uploaded' },
      { status: 400 }
    );
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, error: 'File size exceeds 10MB limit' },
      { status: 400 }
    );
  }

  // Validate MIME type
  const ALLOWED_MIMES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'File type not allowed' },
      { status: 400 }
    );
  }

  // Get project_id from task
  const taskResult = await query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
  if (taskResult.rowCount === 0) {
    return NextResponse.json(
      { success: false, error: 'Task not found' },
      { status: 404 }
    );
  }
  const projectId = taskResult.rows[0].project_id;

  // Sanitize and save file
  const ext = path.extname(file.name).toLowerCase();
  const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  const filename = `${Date.now()}_${base}${ext}`;

  const uploadDir = path.join(process.cwd(), 'uploads', 'projects', String(projectId), 'tasks', String(taskId));
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  // Save to database (same INSERT as before)
  const relativePath = path.join('uploads', 'projects', String(projectId), 'tasks', String(taskId), filename)
    .replace(/\\/g, '/');

  const result = await query(
    `INSERT INTO task_evidence (task_id, file_path, file_name, file_type, file_size, description, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [taskId, relativePath, file.name, fileType || 'other', file.size, description, auth.user.userId]
  );

  return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
}
```

**Option B: busboy (streaming)**

For very large files, `busboy` parses multipart streams without loading the entire file into memory. Overkill for 10MB limit -- Option A is fine.

### 6.3 File Download

The current `GET /api/evidence/:id/download` uses `res.download()`. In Next.js:

```typescript
// app/api/evidence/[id]/download/route.ts
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const result = await query(
    'SELECT file_path, file_name FROM task_evidence WHERE id = $1',
    [id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
  }

  const evidence = result.rows[0] as { file_path: string; file_name: string };
  const filePath = path.join(process.cwd(), evidence.file_path);

  if (!existsSync(filePath)) {
    return NextResponse.json({ success: false, error: 'File not found on disk' }, { status: 404 });
  }

  const fileBuffer = await readFile(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Disposition': `attachment; filename="${evidence.file_name}"`,
      'Content-Type': 'application/octet-stream',
    },
  });
}
```

### 6.4 Static File Serving for Uploads

Current Express serves `uploads/` via `express.static()`. In Next.js, the `public/` directory is served statically. Two options:

**Option A (simpler):** Move uploads into `public/uploads/`. Files are accessible at `/uploads/...`. Downside: `public/` is meant for static build assets, not user-generated content, and `next build` processes this directory.

**Option B (recommended):** Keep `uploads/` at project root (outside `public/`). Serve uploaded files ONLY through the API route (`/api/evidence/:id/download`). This is already how the app works -- evidence is accessed via the download endpoint, not via direct URL. The `express.static('/uploads')` in `app.ts` is only used for image preview URLs. If direct URL access is needed, add a catch-all route:

```typescript
// app/api/uploads/[...path]/route.ts
// Serves files from the uploads directory
```

**Recommendation:** Use Option B. It keeps user uploads outside the build process and maintains auth control over file access.

---

## 7. Migration Order

### Phase 1: Scaffold (Day 1)

1. **Initialize Next.js** in `frontend/`:
   - `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false`
   - Or manually: install `next`, create `next.config.ts`, update `tsconfig.json`
   - Keep existing `src/` structure but move into App Router layout

2. **Move shared code** into `lib/`:
   - `server/src/utils/db.ts` -> `frontend/lib/db.ts` (add globalThis singleton)
   - `server/src/middleware/auth.ts` -> `frontend/lib/auth.ts` (rewrite as helper)
   - `server/src/services/spiCalculator.ts` -> `frontend/lib/spiCalculator.ts` (no changes)
   - `server/src/types/index.ts` -> `frontend/types/server.ts` (backend-only types, or merge with existing)

3. **Merge dependencies** into single `package.json`

4. **Create root layout** (`app/layout.tsx`):
   - QueryClientProvider wrapper
   - Global CSS imports (Tailwind)

5. **Verify:** `npm run dev` starts without errors (blank pages OK)

### Phase 2: API Routes (Day 2-3)

Migrate in dependency order -- start with routes that have no dependencies on other routes:

1. **Auth routes** (2 endpoints) -- login, register
   - These are the foundation. Test immediately with Postman/curl.

2. **Users routes** (4 endpoints) -- depends on auth
   - Test: login, then GET /api/users/me

3. **Simple CRUD routes** (no file uploads, no complex dependencies):
   - Clients (5 endpoints)
   - Materials (4 endpoints)
   - Budget (4 endpoints)
   - Daily Reports (2 endpoints)

4. **Core business routes:**
   - Projects (10 endpoints) -- includes SPI recalculation
   - Tasks (8 endpoints) -- includes SPI recalculation, status transitions

5. **Dashboard routes** (8 endpoints) -- complex SQL, read-only

6. **File upload routes** (last, most different from Express):
   - Evidence (4 endpoints)
   - Activities (5 endpoints)
   - Escalations (6 endpoints)

**Testing strategy:** After each group, test with the existing frontend (which still uses axios to `/api/...`). Since Next.js serves both the frontend and API on the same port, the axios client should just work.

### Phase 3: Frontend Pages (Day 3-4)

1. **Create page files** for each route:
   - Each page file is a thin wrapper: `'use client'; import XPage from '@/pages/XPage'; export default Page() { return <XPage />; }`
   - Or move existing page components directly into `app/{route}/page.tsx`

2. **Remove react-router-dom:**
   - Replace `<BrowserRouter>`, `<Routes>`, `<Route>` with file-based routing
   - Replace `<Navigate to="/x">` with `redirect('/x')` or `useRouter().push('/x')`
   - Replace `useNavigate()` with `useRouter()` from `next/navigation`
   - Replace `useParams()` from react-router with `useParams()` from `next/navigation`
   - Replace `<Link to="/x">` with `<Link href="/x">` from `next/link`

3. **Update Layout component:**
   - Replace react-router's `useLocation` with `usePathname()` from `next/navigation`
   - Replace `<Link to>` with `<Link href>` from `next/link`

4. **Auth flow:**
   - The `ProtectedRoute` component logic moves into the root layout or a client-side wrapper
   - Login redirect: `useRouter().push('/login')` instead of `<Navigate to="/login">`

### Phase 4: Verify (Day 4)

1. `npx tsc --noEmit` -- zero errors
2. `npm run build` -- successful production build
3. Manual testing of each page and feature
4. Verify file uploads work
5. Verify auth flow (login, protected routes, role-based access)

### Phase 5: Cleanup (Day 5)

1. Delete `server/` directory entirely
2. Delete `frontend/vite.config.ts`
3. Remove all `react-router-dom` imports (should be done in Phase 3)
4. Update `run.py` to start only `npm run dev` (no separate Express server)
5. Update any documentation

---

## 8. What Stays the Same

### 8.1 ALL React Components (31 files) -- NO CHANGES

```
components/
  charts/
    ProjectHealthPieChart.tsx
    BudgetStatusChart.tsx
    EarnedValueChart.tsx
    OverdueTasksChart.tsx
    TasksByStatusChart.tsx
    TasksByDueDateChart.tsx
    TasksByOwnerChart.tsx
    SummaryStatsCards.tsx
  tasks/
    KanbanBoard.tsx
    KanbanCard.tsx
    TaskTable.tsx
    TaskDetailModal.tsx
    TaskForm.tsx
    TaskStatusSelect.tsx
    TaskTimer.tsx
    ActivityFeed.tsx
    ViewToggle.tsx
  projects/
    ProjectForm.tsx
    MaterialsList.tsx
    BudgetTable.tsx
  evidence/
    EvidenceUploader.tsx
    EvidenceGallery.tsx
  dashboard/
    ProjectCard.tsx
    ProjectHealthGrid.tsx
    SummaryCards.tsx
  ui/
    Layout.tsx           -- minor changes (Link imports, usePathname)
    Modal.tsx
    StatusBadge.tsx
    ProgressBar.tsx
    EmptyState.tsx
    ConfirmDialog.tsx
```

Only `Layout.tsx` needs import changes (react-router -> next/navigation). All other components are pure React with no routing dependencies.

### 8.2 ALL Custom Hooks (9 files) -- NO CHANGES

```
hooks/
  useAuth.ts
  useDashboard.ts
  useProjects.ts
  useTasks.ts
  useClients.ts
  useMaterials.ts
  useBudget.ts
  useActivities.ts
  useEscalations.ts
```

These all use TanStack Query + the api.ts service layer. They have zero dependency on Express or Vite. They work identically in Next.js.

### 8.3 ALL Types (both files) -- NO CHANGES

- `frontend/src/types/index.ts` -- kept as-is
- `server/src/types/index.ts` -- moved to `frontend/types/server.ts` or merged

### 8.4 API Service Layer -- MINIMAL CHANGES

`frontend/src/services/api.ts` -- Only change needed:

```diff
 const api = axios.create({
-  baseURL: '/api',
+  baseURL: '/api',    // SAME -- but now same-origin instead of proxied
   headers: { 'Content-Type': 'application/json' },
 });
```

Actually, NO changes needed. The baseURL `/api` works identically because Next.js serves both the frontend and API routes on the same origin. The Vite proxy is simply no longer needed.

### 8.5 Database Schema -- NO CHANGES

- `server/database/schema.sql` -- move to `frontend/database/schema.sql` (or project root)
- `server/database/seed.sql` -- same
- `server/database/setup.ts` -- same, update import path for db.ts

### 8.6 Business Logic -- NO CHANGES

- `spiCalculator.ts` -- moved to `lib/`, zero code changes
- All SQL queries in route handlers -- identical

---

## 9. Risk Assessment & Mitigations

### Risk 1: File Upload Regression (MEDIUM)
**What:** multer -> Web FormData API is a different parsing approach.
**Impact:** Evidence upload, activity creation, escalation creation could break.
**Mitigation:** Test each upload route individually. The Web FormData API is well-documented and handles the same content types. Keep the 10MB limit. Write the upload helper once, reuse across all three route files.

### Risk 2: HMR Connection Pool Leak (LOW)
**What:** Next.js dev server hot-reloads modules, potentially creating multiple pg Pools.
**Impact:** "too many connections" errors in development.
**Mitigation:** The `globalThis` singleton pattern (section 5.2) prevents this. Standard Next.js practice.

### Risk 3: Auth Token Handling (LOW)
**What:** localStorage-based auth remains client-side only.
**Impact:** No regression -- same pattern as current app. Next.js middleware cannot read localStorage, but we are not using middleware for auth enforcement.
**Mitigation:** Keep existing ProtectedRoute client-side pattern. Document cookie migration as future enhancement.

### Risk 4: Static File Serving for Uploads (LOW)
**What:** Express `static()` middleware served uploads directly. Next.js has no equivalent for directories outside `public/`.
**Impact:** Direct URL access to uploaded files (`/uploads/projects/1/tasks/2/file.jpg`) breaks.
**Mitigation:** All file access already goes through `/api/evidence/:id/download`. If direct access is needed, add a catch-all API route that streams files from the uploads directory.

### Risk 5: TypeScript Config Differences (LOW)
**What:** Next.js has its own `tsconfig.json` requirements (jsx: preserve, module: esnext, etc.).
**Impact:** Compilation errors on first setup.
**Mitigation:** Use `create-next-app` defaults, then merge in the existing strict settings. Key settings: `"paths": { "@/*": ["./*"] }` for import aliases.

### Risk 6: Build Time Impact (LOW)
**What:** 57 API route handlers + 11 pages is more than a typical Next.js app.
**Impact:** Slightly longer cold starts and builds.
**Mitigation:** All API routes are dynamic (database queries), so they will not be pre-rendered. Use `export const dynamic = 'force-dynamic'` where needed. Build impact is negligible for this scale.

---

## 10. Key Conversion Patterns (Quick Reference)

### Express -> Next.js Cheat Sheet

| Express | Next.js App Router |
|---------|-------------------|
| `const router = Router()` | `export async function GET/POST/PATCH/DELETE()` |
| `req.body` | `await request.json()` |
| `req.params.id` | `const { id } = await params` |
| `req.query.status` | `request.nextUrl.searchParams.get('status')` |
| `req.headers.authorization` | `request.headers.get('authorization')` |
| `req.user` (from middleware) | `authenticateRequest(request).user` |
| `req.file` (multer) | `(await request.formData()).get('file')` |
| `res.json({})` | `return NextResponse.json({})` |
| `res.status(404).json({})` | `return NextResponse.json({}, { status: 404 })` |
| `res.download(path, name)` | `return new NextResponse(buffer, { headers: {...} })` |
| `router.use(authenticate)` | Call `authenticateRequest()` at handler start |
| `router.use(authorize(...))` | Call `authorizeRoles()` at handler start |

### react-router-dom -> next/navigation Cheat Sheet

| react-router-dom | Next.js |
|-----------------|---------|
| `<BrowserRouter>` | Removed (built-in) |
| `<Routes>/<Route>` | File-based routing (`app/path/page.tsx`) |
| `<Link to="/x">` | `<Link href="/x">` from `next/link` |
| `<Navigate to="/x">` | `redirect('/x')` from `next/navigation` |
| `useNavigate()` | `useRouter()` from `next/navigation` |
| `useParams()` | `useParams()` from `next/navigation` |
| `useLocation()` | `usePathname()` from `next/navigation` |
| `useSearchParams()` | `useSearchParams()` from `next/navigation` |

---

## 11. Implementation Effort Estimate

| Component | Files | Complexity | Notes |
|-----------|-------|------------|-------|
| Next.js scaffold + config | 5 | Low | next.config, tsconfig, layout, middleware, package.json |
| Auth helper (lib/auth.ts) | 1 | Low | Rewrite of 36-line middleware |
| DB singleton (lib/db.ts) | 1 | Low | Add globalThis wrapper to existing code |
| SPI calculator (lib/) | 1 | None | Copy, zero changes |
| Types (merged) | 1 | Low | Merge frontend + backend types |
| API route handlers | 42 | Medium | Mechanical translation, upload routes need more care |
| Page files | 11 | Low | Thin wrappers or direct moves |
| Layout update | 1 | Low | Replace react-router imports |
| API client update | 1 | None | baseURL already correct |
| Components | 0 | None | No changes needed |
| Hooks | 0 | None | No changes needed |
| **Total** | **~64** | **Medium** | Mostly mechanical, upload routes are the hard part |

Estimated implementation time: 2-3 focused sessions.

---

## STRATEGIC_ANALYSIS

```yaml
STRATEGIC_ANALYSIS:
  decision: PROCEED
  recommended_approach: >
    Migrate in 5 phases: scaffold, API routes (dependency order),
    frontend pages, verify, cleanup. Keep all React components, hooks,
    types, and API client unchanged. The migration is structurally
    mechanical with three areas of care: file uploads, auth helpers,
    and DB connection singleton.
  tradeoffs:
    pros:
      - Single process (no Express + Vite proxy)
      - Thesis requirement satisfied (Next.js)
      - File-based routing eliminates react-router-dom
      - Same-origin API calls (no CORS)
      - Simpler deployment (one `npm start`)
      - Future path to Server Components and SSR
    cons:
      - All 57 API endpoints need rewriting (mechanical but tedious)
      - multer replacement requires new upload pattern
      - Development HMR needs globalThis pattern for DB pool
      - No SSR benefit yet (all pages are 'use client')
      - Loss of Express middleware chain (each handler checks auth manually)
  risks:
    - File upload regression (multer -> Web FormData)
    - HMR connection pool leak in development
    - TypeScript config merge conflicts
    - Build time slightly increased (57 API routes)
  implementation_notes:
    - Start with auth + users routes to establish the pattern
    - Migrate upload routes last (most different from Express)
    - Test each route group before moving to the next
    - Keep axios client unchanged (baseURL /api works same-origin)
    - All 31 React components transfer with zero changes
    - All 9 hooks transfer with zero changes
  validation_focus:
    security: >
      JWT auth pattern preserved. localStorage token storage unchanged.
      File upload validation (MIME types, size limits) must be replicated
      exactly in the new FormData parsing. No new attack surface.
    quality: >
      TypeScript strict mode. Run tsc --noEmit after each phase.
      Manual test each role (technician, manager, admin) end-to-end.
      Verify SPI calculations, file uploads, timer start/stop.
    build: >
      npm run build must succeed. Verify no Vite artifacts remain.
      Verify server/package.json dependencies are merged.
      Update run.py to start single process.
```
