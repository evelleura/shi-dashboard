# 2. System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React 19 + Next.js 15 (App Router) + TanStack Query 5      │
│  - Dashboard Page     - Projects Page     - Tasks Page       │
│  - Timeline Page      - Reports Page      - Audit Log Page   │
│  - User Management    - Profile Page      - Login Page       │
│  ────────────────────────────────────────────────────────── │
│  8 Chart Types (Recharts 3) + Kanban Board + Data Tables    │
│  Tailwind CSS v4 (Dark mode support) + Bank-style Calendar  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  Next.js API Routes (frontend/src/app/api/[...route])       │
│  - Authentication      - User Management    - Dashboard      │
│  - Projects CRUD       - Tasks CRUD         - Materials      │
│  - Budget             - Evidence Upload     - Audit Logs     │
│  - SPI Calculation    - Charts              - Search         │
│  ────────────────────────────────────────────────────────── │
│  Request Handlers in /src/lib/handlers/*.ts                  │
│  Authorization layer with role-based access control         │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  PostgreSQL 18 (Local system install)                        │
│  8 Tables + Indexes + Constraints + Audit Log Table         │
│  - users             - clients           - projects          │
│  - tasks             - task_evidence     - materials         │
│  - budget_items      - project_health    - daily_reports     │
│  - project_assignments  - audit_log                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Details

### Frontend

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 19 | UI rendering with hooks |
| Meta-framework | Next.js | 15 | Server-side rendering, API routes, App Router |
| Build Tool | Vite | Latest | Fast dev server, optimized builds |
| State Management | TanStack Query | 5 | Server state caching, invalidation |
| Styling | Tailwind CSS | v4 | Utility-first CSS with @custom-variant support |
| Charts | Recharts | 3 | SVG-based responsive charts |
| UI Components | Custom | - | Modal, DatePicker, StatusBadge, DataTable |
| Icons | Heroicons | Latest | Consistent SVG icons |
| Date Handling | date-fns | Latest | Parse, format, compare dates |
| HTTP Client | fetch API | Built-in | Parameterized requests with headers |
| Form Validation | HTML5 + Custom | - | Client-side validation before submit |
| Theme System | useSyncExternalStore | React 19 | Shared dark mode state without Context |

### Backend

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 18+ | JavaScript execution |
| Framework | Express | 5 | HTTP server, routing, middleware |
| Language | TypeScript | Latest | Type safety, compile-time checks |
| DB Driver | pg (node-postgres) | Latest | Native PostgreSQL connections |
| Password Hashing | bcryptjs | Latest | Secure password storage |
| Authentication | JWT | Standard | Stateless token-based auth |
| Middleware | Custom | - | Request parsing, CORS, auth checks |
| File Upload | multer | Latest | Handle multipart/form-data |
| Environment | dotenv | Latest | Load .env.local variables |

### Database

| Aspect | Choice | Rationale |
|---|---|---|
| DBMS | PostgreSQL 18 | Open-source, ACID compliance, JSON support, powerful indexing |
| Schema | 8 tables | Normalized design, prevents duplication |
| Relationships | Foreign keys | Referential integrity, cascade delete |
| Computed Columns | GENERATED ALWAYS | Duration, total_price auto-calculated |
| Indexing | Strategic | ON project_id, status, due_date, client_id |
| Constraints | CHECK + UNIQUE | Data validity, no duplicates |
| Audit Trail | Separate table | Track all changes with user & timestamp |
| Connection Pool | pg Pool | Reuse connections, prevent exhaustion |

---

## Data Flow Architecture

### Create Project Flow
```
User (Manager)
    │
    ├─ Form Submit (POST /api/projects)
    │
    ▼
API Handler: createProject()
    ├─ Authenticate request
    ├─ Authorize (manager|admin only)
    ├─ Validate inputs (dates, client exists)
    ├─ Generate project_code (SHI-YYMMXXX)
    ├─ INSERT into projects table
    ├─ Trigger SPI calculation
    ├─ Log change to audit_log
    │
    ▼
Response: { success: true, data: project }
    │
    ▼
TanStack Query invalidates "projects" cache
    │
    ▼
UI re-fetches & re-renders project list
```

### Task Status Change Flow
```
User (Technician/Manager)
    │
    ├─ Click status dropdown
    ├─ Select new status (e.g., "working_on_it")
    ├─ PATCH /api/tasks/:id
    │
    ▼
API Handler: updateTask()
    ├─ Authenticate & authorize
    ├─ UPDATE tasks table
    ├─ Log old_status → new_status to audit_log
    ├─ Trigger SPI recalculation for project
    ├─ Return updated task
    │
    ▼
TanStack Query invalidates task & project caches
    │
    ▼
Dashboard charts update automatically
```

### SPI Calculation Flow
```
Task status changes (to_do → in_progress → done)
    │
    ▼
recalculateSPI(project_id) triggered
    │
    ├─ SELECT all tasks for project
    ├─ Count: total, completed, working, overtime, overdue
    ├─ Calculate: SPI = (completed / total) / (days_elapsed / total_days)
    ├─ Determine status: green|amber|red
    ├─ UPSERT into project_health table
    │
    ▼
Dashboard fetches project_health
    │
    ▼
Color-coded status displayed + sorting applied
```

---

## API Architecture

### Route Organization

```
frontend/src/app/api/[...route]/route.ts
│
├─ GET /api/auth/me              → authenticateRequest() check
├─ POST /api/auth/login
├─ POST /api/auth/register
├─ POST /api/auth/logout
│
├─ GET /api/projects             → listProjects()
├─ POST /api/projects            → createProject()
├─ GET /api/projects/:id         → getProjectDetail()
├─ PATCH /api/projects/:id       → updateProject()
├─ DELETE /api/projects/:id      → deleteProject()
├─ POST /api/projects/:id/approve-survey
├─ GET /api/projects/:id/health
├─ GET /api/projects/:id/timeline
│
├─ GET /api/tasks
├─ GET /api/tasks/project/:projectId
├─ GET /api/tasks/my-tasks       → technician view
├─ POST /api/tasks
├─ GET /api/tasks/:id
├─ PATCH /api/tasks/:id          → includes status change
├─ DELETE /api/tasks/:id
├─ POST /api/tasks/:id/timer-start
├─ POST /api/tasks/:id/timer-stop
│
├─ GET /api/evidence
├─ POST /api/evidence            → multer upload
├─ GET /api/evidence/:id/download
├─ DELETE /api/evidence/:id
│
├─ GET /api/users                → admin only
├─ POST /api/users               → admin only
├─ PATCH /api/users/:id          → admin only
├─ DELETE /api/users/:id         → admin only
├─ POST /api/users/:id/reset-password
├─ PATCH /api/users/me           → logged-in user
├─ POST /api/users/me/change-password
├─ GET /api/users/technicians    → managers only
│
├─ GET /api/clients
├─ POST /api/clients
├─ PATCH /api/clients/:id
├─ DELETE /api/clients/:id
├─ GET /api/clients/:id
│
├─ GET /api/materials/:projectId
├─ POST /api/materials
├─ PATCH /api/materials/:id
├─ DELETE /api/materials/:id
│
├─ GET /api/budget/:projectId
├─ POST /api/budget
├─ PATCH /api/budget/:id
├─ DELETE /api/budget/:id
│
├─ GET /api/dashboard            → summary cards
├─ GET /api/dashboard/health     → project health list
├─ GET /api/dashboard/charts/status
├─ GET /api/dashboard/charts/owner
├─ GET /api/dashboard/charts/due-date
├─ GET /api/dashboard/charts/overdue
├─ GET /api/dashboard/charts/budget
├─ GET /api/dashboard/charts/earned-value
├─ GET /api/dashboard/charts/categories
├─ GET /api/dashboard/charts/technician-workload
├─ GET /api/dashboard/charts/spi-trend
├─ GET /api/dashboard/charts/recent-activity
├─ GET /api/dashboard/charts/tech-productivity
├─ GET /api/dashboard/charts/tech-time-spent
├─ GET /api/dashboard/search     → global search
│
├─ GET /api/escalations
├─ POST /api/escalations
├─ GET /api/escalations/:id
├─ PATCH /api/escalations/:id
├─ DELETE /api/escalations/:id
│
├─ GET /api/audit-log           → admin only
└─ GET /api/audit-log/:entityType/:entityId
```

---

## Request/Response Pattern

### Standard Success Response
```json
{
  "success": true,
  "data": { /* entity object */ }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Authenticated Request Flow
```typescript
// All API routes check:
const auth = authenticateRequest(request);
if (!auth.user) return auth.errorResponse;  // 401

// Role-based authorization:
const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
if (roleCheck) return roleCheck;  // 403
```

---

## Caching & Performance Strategy

### TanStack Query Configuration
```typescript
// Default cache settings in frontend
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### Cache Invalidation
- Project list: invalidated on create/update/delete project
- Task list: invalidated on create/update/delete task OR status change
- Dashboard data: invalidated on any project/task change
- User list: invalidated on create/update/delete user
- Chart data: invalidated with date range changes

---

## Security Architecture

### Authentication Flow
```
1. POST /api/auth/login { email, password }
   ├─ Query user by email
   ├─ bcrypt.compare(password, hash)
   ├─ Generate JWT token
   └─ Return token + user

2. Store token in localStorage (frontend)

3. Every subsequent request:
   ├─ Include header: Authorization: Bearer <token>
   ├─ Backend: JWT.verify(token, secret)
   ├─ Extract user_id, role from decoded token
   └─ Proceed if valid
```

### Authorization Checks
```typescript
// Role-based: Only certain roles can access endpoints
authorizeRoles(auth.user, ['manager', 'admin'])
  ├─ GET /api/users (admin only)
  ├─ POST /api/audit-log (viewing)
  └─ DELETE /api/projects (manager|admin)

// Resource ownership: User can only access own data
if (parseInt(id) === auth.user.userId)  // Allow
if (parseInt(id) !== auth.user.userId)  // Deny
```

### SQL Injection Prevention
```typescript
// ✅ Safe: Parameterized queries
query('SELECT * FROM users WHERE id = $1', [userId])

// ❌ Unsafe: String interpolation
query(`SELECT * FROM users WHERE id = ${userId}`)
```

---

## Error Handling Strategy

### API Layer
- Input validation before DB access
- Try-catch on all DB queries
- Consistent error response format
- Logging to console (production: use logger service)
- HTTP status codes: 400 (bad), 401 (auth), 403 (forbidden), 500 (server)

### Frontend Layer
- TanStack Query automatic retry
- User-facing error toast notifications
- Fallback UI for failed queries
- Console logging for debugging
- Graceful degradation (show cached data if refresh fails)

---

## Scalability Considerations

### Current Scale
- ✅ Handles 100+ projects
- ✅ 1000+ tasks
- ✅ 50+ users (technicians + managers + admins)

### Future Improvements
- Connection pooling (pg Pool already configured)
- Query result caching (Redis layer)
- Pagination for large result sets
- Database replication for read scaling
- API rate limiting
- CDN for static assets

---

## Deployment Architecture

### Development
- Local PostgreSQL (system install)
- Next.js dev server (port 3000)
- Adminer GUI (port 8888)
- Hot module reloading enabled

### Production (Recommended)
- PostgreSQL on dedicated server
- Next.js app deployed on VPS/PaaS
- Environment variables in .env.production.local
- Reverse proxy (Nginx) for SSL/TLS
- Process manager (PM2) for reliability

---

## Monitoring & Observability

### Logs
- API request/response logging
- Database query logging
- Error stack traces
- User action audit trail

### Metrics to Track
- Dashboard load time
- API response times
- Database query performance
- Task completion rates
- SPI trend over time
- User adoption metrics

