---
task_id: "20260404_0001_dashboard_rewrite"
agent: "naomi"
phase: "exploration"
status: "COMPLETE"
timestamp: "2026-04-04T02:15:00Z"
---

# Exploration: Reference App (task15-daily-task-planner)

## Summary

The reference app is a **Go + SQLite + vanilla HTML/JS** daily task planner with admin dashboard. It is structurally very different from our target (Node/Express/PostgreSQL + React), but contains strong **architectural patterns** and **UI design patterns** that are directly reusable.

---

## 1. Tech Stack

| Layer | Reference App | SHI Dashboard (target) |
|-------|--------------|----------------------|
| Language | Go 1.25 | Node.js + TypeScript |
| Database | SQLite (modernc.org/sqlite, WAL mode) | PostgreSQL (Prisma/TypeORM) |
| Frontend | Vanilla HTML + inline JS (single-file SPA ~4400 lines) | Vite + React + TanStack Query |
| CSS | Tailwind CDN + CSS variables (dark/light theme) | TBD (Tailwind recommended) |
| Auth | Cookie-based sessions, bcrypt | TBD (same pattern applicable) |
| Charts | NONE -- custom HTML/CSS activity bar | TBD (need real charts for SPI) |
| PDF | go-pdf/fpdf | Not in scope initially |
| Deployment | Docker + Fly.io | TBD |

**Key insight:** No chart library at all. All visualization is hand-built HTML divs with percentage widths. For SHI dashboard we NEED a real chart library (Chart.js or Recharts) for SPI trends, project health distribution, etc.

---

## 2. Project Structure and Architecture

```
task15-daily-task-planner/
  main.go                          # Entry point: DB init, migrations, server start
  config.json                      # Default statuses/categories config
  go.mod / go.sum                  # Dependencies
  internal/
    database/
      database.go                  # DB connection (SQLite + WAL + FK)
      migrate.go                   # Migration runner + seed data
      migrations/
        001_initial.sql            # Users, sessions, daily_plans, app_config
        002_force_password_change.sql
    handler/
      auth.go                      # Login/logout, session middleware, admin middleware
      helpers.go                   # writeJSON, writeError utilities
      plans.go                     # GET/PUT daily plans
      tasks.go                     # CRUD tasks within a plan
      admin.go                     # Admin stats, users, sessions, export/import
      config.go                    # GET/PUT app config
      generate.go                  # PDF generation endpoint
      health.go                    # Health check
    model/
      plan.go                      # Plan, Task, TimelineSlot, AppConfig structs
      user.go                      # User, Session, LoginRequest
      response.go                  # Standard JSON envelope (Response, ErrorResponse)
    pdfgen/
      generate.go                  # PDF generation logic
    server/
      server.go                    # Middleware chain assembly
      routes.go                    # All route registration
      middleware.go                # CORS, body limit, logging, recovery
  static/
    index.html                     # Main SPA (4395 lines, all JS inline)
    login.html                     # Login page (272 lines)
    admin.html                     # Admin dashboard (1604 lines)
    lofi.html                      # Music player (not relevant)
```

### Reusable Patterns for SHI:

1. **Clean separation:** `internal/handler/` per-domain, `internal/model/` for types, `internal/database/` for DB ops
2. **Migration system:** Numbered SQL files + `_migrations` tracking table with backfill logic
3. **Standard JSON envelope:** `{ data: ..., message: ... }` for success, `{ error: ..., details: ... }` for errors
4. **Middleware chain:** Recovery -> Logging -> CORS -> Body limit -> Routes (compose from outside in)
5. **Handler factory pattern:** Each handler is a function returning `http.HandlerFunc`, with DB injected via closure

---

## 3. Data Model

### Tables (4 total):

**users**
- id (PK), username (UNIQUE), password_hash, role (user|admin), created_at, force_password_change

**sessions**
- id (PK), user_id (FK->users), token (UNIQUE), device_info, created_at, expires_at

**daily_plans**
- id (PK), user_id (FK->users), date, data (JSON blob), updated_at
- UNIQUE(user_id, date)

**app_config**
- id (PK, always 1), data (JSON blob)

### Data Shape (Plan JSON stored in daily_plans.data):

```json
{
  "meta": { "date": "...", "org": "...", "preparedBy": "..." },
  "tasks": [
    {
      "cat": "Planning/Strategies",
      "task": "Task name",
      "useless": "-",
      "important": "why",
      "key": "person",
      "forWho": "beneficiary",
      "dur": "2 hr",
      "urgency": "High",
      "worseCase": "...",
      "mitigation": "...",
      "alternateTask": "...",
      "elapsed": 2886,
      "startedAt": "14:23",
      "stoppedAt": "15:11",
      "status": "WellDone",
      "objective": "..."
    }
  ],
  "priorityOrder": [0, 2, 1],
  "timeline": [{ "time": "15:00", "task": "...", "dur": "1h", "isBreak": false, "locked": false }],
  "activeTaskIndex": -1,
  "trackingStartTime": null,
  "workStart": "15:00",
  "workEnd": "23:00",
  "showSubPriorities": false,
  "viewMode": "compact"
}
```

### Key Design Decision: JSON Blob vs Normalized

The reference app stores the entire daily plan as a **JSON blob** in `daily_plans.data`. Tasks are not individual rows -- they are array elements inside the JSON.

**For SHI:** We should use **normalized tables** (projects, daily_reports, project_health) because:
- We need to query across projects (dashboard aggregation)
- SPI calculation needs individual report records
- PostgreSQL supports efficient joins/aggregation
- The reference app's approach works for personal task management but not multi-project dashboards

---

## 4. UI Patterns

### 4.1 Dashboard Layout (admin.html)

```
+------------------------------------------+
| HEADER: Title | Badge | User | Actions   |
+------------------------------------------+
| STATS GRID (5 stat cards):               |
| [Total Users] [Online] [Tasks] [Done]    |
| [Time Tracked]                           |
+------------------------------------------+
| USERS SECTION:                           |
| Title + Count + Action buttons           |
| Table: checkbox | ID | Name | Role | ... |
| Plan viewer (collapsible detail)         |
+------------------------------------------+
| SESSIONS SECTION:                        |
| Title + Count                            |
| Table: ID | User | Device | Created | ...|
+------------------------------------------+
```

**Reusable for SHI:**
- Stats grid at top with colored stat cards (we use: Total Projects, On Track, Warning, Critical, Active Technicians)
- Section-based layout with title bars
- Table + detail panel pattern
- Auto-refresh (30s interval)

### 4.2 Main App Layout (index.html)

```
Section 00: Document Info (date navigator + meta fields)
Section 01: All Tasks (card layout, view mode toggle: Compact/Normal/Detailed)
Section 02: Timeline (time blocks with work hours)
Section 03: Activity Log (stats + activity bar + breakdown table)
Actions: Generate PDF | History | Clear
```

**Reusable for SHI:**
- Section-based card layout with accent colors per section
- View mode toggle (compact/normal/detailed) -- great for project list
- Activity bar (time-proportional colored blocks) -- adaptable for project timeline
- Stats summary at top of each section

### 4.3 Theming System (CSS Variables)

Two themes: dark (default) and light, using CSS custom properties:
- `--bg-page`, `--bg-card`, `--bg-input`
- `--border-card`, `--border-input`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-teal`, `--accent-orange`, `--accent-purple`, `--accent-gold`, `--accent-green`
- Toggle via `data-theme` attribute on `<html>`

**Reusable for SHI:** Exact same CSS variable pattern. Map accent colors to RAG:
- `--accent-green` = On Track (SPI >= 0.95)
- `--accent-gold` = Warning (0.85 <= SPI < 0.95)
- `--accent-orange` / `--accent-red` = Critical (SPI < 0.85)

### 4.4 Status System

8 statuses with color coding:
- Think (#9a9da5), WillDo (#4ecdc4), Doing (#3b82f6), WellDone (#06d6a0)
- Alternated (#9b5de5), Delayed (#ffd700), Procrastinated (#ff6b35), Trashed (#ef4444)
- Auto-transitions on play/stop/switch actions

**Adaptable for SHI:** Map to project health statuses:
- Green (#06d6a0), Amber (#ffd700), Red (#ef4444), Completed (#4ecdc4)

---

## 5. Task Tracking and Progress Reporting

### Time Tracking Pattern:
- `activeTaskIndex`: which task is being tracked
- `trackingStartTime`: epoch ms when tracking started
- `elapsed`: accumulated seconds (survives page reload)
- `startedAt` / `stoppedAt`: HH:MM timestamps

### Auto-save Pattern:
- `scheduleAutoSave()` debounces (5s delay)
- Saves entire plan JSON to `PUT /api/daily/{date}`
- Visual indicator: "Saving..." / "Saved" / "Offline"

### Activity Log (section 03):
- Calculates productivity: `(tracked_time / available_time) * 100%`
- Color-coded bar: task blocks proportional to duration, idle gaps
- Breakdown table: Task | Category | Estimated | Actual | Diff | Status

**Adaptable for SHI:**
- Replace per-task tracking with per-project SPI tracking
- Activity bar concept -> project health timeline (days on x-axis, SPI blocks color-coded)
- Breakdown table -> project report table with SPI values

---

## 6. Reusable Patterns for SHI Dashboard

### DIRECTLY REUSABLE:

| Pattern | Source | SHI Application |
|---------|--------|-----------------|
| CSS variable theming (dark/light) | index.html :root | Same system, map to SHI brand colors |
| Stats grid layout | admin.html .stats-grid | Dashboard summary cards (project counts by status) |
| Standard API envelope | model/response.go | `{ data, message }` / `{ error, details }` |
| Auth middleware chain | handler/auth.go | Session-based auth for technician/manager roles |
| Rate limiting on login | handler/auth.go (5/min/IP) | Same pattern for Express |
| Section-based card layout | index.html sections 00-03 | Dashboard sections: Overview, Projects, Reports |
| View mode toggle (Compact/Normal/Detailed) | index.html viewToggle | Project list density control |
| Toast notification system | showToast() function | Same pattern for React toast |
| Modal dialog system | showModal/showConfirm/showPrompt | React modal components |
| Auto-refresh (30s) | admin.html setInterval | TanStack Query refetchInterval |
| Date navigation (prev/today/next) | index.html dateNav | Report date navigation |
| Export/Import data | admin.go HandleAdminExportData | Project data export for reports |

### ADAPT (concept reuse, different implementation):

| Concept | Reference | SHI Adaptation |
|---------|-----------|----------------|
| JSON blob storage | daily_plans.data TEXT | Normalized PostgreSQL tables (projects, daily_reports, project_health) |
| Activity bar visualization | renderActivityLog() HTML divs | Real chart library (Chart.js/Recharts) for SPI trends |
| Task status colors | config.json statuses array | Project health RAG colors (Green/Amber/Red) |
| Time tracking (elapsed seconds) | startTracking()/stopTracking() | SPI calculation engine (EV/PV formula) |
| Priority ordering | priorityOrder array | Sort by urgency: Red -> Amber -> Green |
| PDF generation | pdfgen/generate.go | Not in initial scope |

### NOT RELEVANT:

| Feature | Why Skip |
|---------|----------|
| Lofi music player | Entertainment feature, not applicable |
| Timeline scheduling | Personal time block feature, SHI has project timelines |
| Drag-and-drop task reordering | Not needed for daily report input |
| Canvas FX overlay | Visual effect, not applicable |

---

## 7. Risks and Recommendations

### Risks from reference app's PROJECT MEMORY:

1. **SQLite MaxOpenConns=1 deadlock** (score 15) -- Not applicable to PostgreSQL, but: always handle connection pooling properly in Prisma
2. **Hardcoded fallback credentials** (score 17) -- NEVER do this. Require env vars for initial admin setup
3. **Single-file 4400-line HTML** -- Anti-pattern. SHI uses React components, already modular
4. **Z-index stacking context issues** (score 13) -- Watch for this in dashboard cards with overlapping modals

### Recommendations:

1. **Use Recharts** (React-native charting) over Chart.js for SPI trend lines, project health distribution pie/donut, and progress bar charts
2. **Copy the CSS variable theming system** verbatim -- it is clean and well-tested for dark/light modes
3. **Copy the API envelope pattern** -- `{ data, message }` / `{ error, details }` is a good standard
4. **Copy the stats grid layout** from admin.html for the dashboard summary
5. **Implement view mode toggle** for the project list (card vs table, compact vs detailed)
6. **Use TanStack Query's refetchInterval** instead of manual setInterval for auto-refresh
7. **DO NOT copy the JSON blob storage pattern** -- SHI needs normalized tables for cross-project queries

---

## EXPLORATION_REPORT

```yaml
EXPLORATION_REPORT:
  entry_point: "main.go -> server.New() -> routes.RegisterRoutes()"
  critical_path:
    - "main.go (startup, DB init, migrations)"
    - "internal/server/routes.go (all API endpoints)"
    - "internal/handler/auth.go (session auth middleware)"
    - "internal/handler/plans.go (daily plan CRUD)"
    - "internal/handler/tasks.go (task CRUD within plan)"
    - "internal/handler/admin.go (admin stats, user management)"
    - "static/index.html (main SPA, 4395 lines)"
    - "static/admin.html (admin dashboard, 1604 lines)"
  problem_domain: "Reference patterns for SHI dashboard rewrite"
  patterns_found:
    - "CSS variable theming (dark/light) with data-theme attribute"
    - "Stats grid layout (5 colored stat cards in auto-fit grid)"
    - "Section-based card layout with accent colors"
    - "View mode toggle (Compact/Normal/Detailed)"
    - "Standard JSON API envelope: {data, message} / {error, details}"
    - "Session-based cookie auth with rate limiting (5/min/IP)"
    - "Middleware chain: recovery -> logging -> CORS -> body limit"
    - "Migration system with _migrations tracking table"
    - "Auto-save with debounce (5s)"
    - "Activity bar: HTML div blocks proportional to time duration"
    - "Toast notification system"
    - "Date navigation (prev/today/next)"
    - "Auto-refresh (30s interval)"
    - "Export/Import data pattern"
  risks_identified:
    - "JSON blob storage does NOT suit SHI (need normalized tables)"
    - "No real chart library used (need Recharts for SPI trends)"
    - "Single-file SPA anti-pattern (already avoided with React)"
    - "Hardcoded credentials risk (referenced in PROJECT MEMORY)"
  NOT_relevant:
    - "Lofi music player (static/lofi.html)"
    - "Canvas FX overlay (fxCanvas)"
    - "Personal timeline scheduling"
    - "Drag-and-drop task reordering"
    - "PDF generation (not in SHI initial scope)"
    - "Go-specific patterns (we use Node.js)"
  recommendations:
    - "Use Recharts for charts (React-native, good for SPI trends)"
    - "Copy CSS variable theming system verbatim"
    - "Copy API envelope pattern: {data, message} / {error, details}"
    - "Copy stats grid layout for dashboard summary"
    - "Implement view mode toggle for project list"
    - "Use normalized PostgreSQL tables (NOT JSON blobs)"
    - "Use TanStack Query refetchInterval for auto-refresh"
```

## Files Explored (16 total)

1. `main.go` -- Entry point, DB init, migrations, server start
2. `go.mod` -- Dependencies: Go 1.25, sqlite, bcrypt, fpdf
3. `config.json` -- 8 statuses with colors, 4 categories
4. `internal/database/migrations/001_initial.sql` -- Schema: users, sessions, daily_plans, app_config
5. `internal/database/migrations/002_force_password_change.sql` -- ALTER TABLE migration
6. `internal/database/database.go` -- SQLite connection with WAL + FK + busy timeout
7. `internal/database/migrate.go` -- Migration runner + seed data
8. `internal/model/plan.go` -- Plan, Task, TimelineSlot, AppConfig, StatusDef structs
9. `internal/model/user.go` -- User, Session, LoginRequest structs
10. `internal/model/response.go` -- Response, ErrorResponse envelopes
11. `internal/server/server.go` -- Middleware chain assembly
12. `internal/server/routes.go` -- All API route registration (26 endpoints)
13. `internal/server/middleware.go` -- CORS, body limit, logging, recovery
14. `internal/handler/auth.go` -- Login, logout, session validation, rate limiting
15. `internal/handler/helpers.go` -- writeJSON, writeError utilities
16. `internal/handler/plans.go` -- GET/PUT daily plans
17. `internal/handler/tasks.go` -- CRUD tasks within plan (read/write plan JSON)
18. `internal/handler/admin.go` -- Admin stats, users, sessions, export/import
19. `internal/handler/config.go` -- GET/PUT app config
20. `internal/handler/generate.go` -- PDF generation endpoint
21. `static/index.html` -- Main SPA (4395 lines, sections 00-03 + actions)
22. `static/login.html` -- Login page (272 lines)
23. `static/admin.html` -- Admin dashboard (1604 lines)
24. `plans/daily_2026-03-31.json` -- Sample plan data shape
25. `CLAUDE.md` -- Project memory with learnings
