# Naomi Audit: E2E Test Landscape

## Critical: Zero test infrastructure exists
- No testing frameworks installed
- No test scripts in package.json
- 0 test files anywhere

## Stack (from .env + package.json)
- Framework: Next.js (not plain Vite!) on port 3000
- DB: PostgreSQL, DB_NAME=shi_dashboard_new, DB_USER=postgres, password=12345
- JWT: localStorage, secret=SecretDian, 7d expiry
- Axios: baseURL='/api' (relative, same Next.js server)
- Bundle manager: bun (uses bunx)

## Scale: 102 source files
- 20 page views (/views/)
- 13 chart components
- 9 task components
- 12 backend handler files
- 13 custom hooks

## Auth system
- POST /api/auth/login → JWT → localStorage('token') + localStorage('user')
- 401 auto-redirect to /login via axios interceptor
- 3 roles: technician | manager | admin

## 52 API Endpoints
- Auth: 2, Users: 11, Clients: 5, Projects: 8+, Tasks: 8, Evidence: 4
- Dashboard: 9, Materials: 4, Budget: 4, Escalations: 8, Activities: 5
- Audit: 1, Util: 1

## Routes (frontend)
- /login, /dashboard (mgr), /projects, /clients, /escalations (mgr)
- /my-dashboard, /my-projects, /my-tasks, /my-escalations (tech)
- /audit-log, /users, /technicians (admin)
- /reports, /schedule, /timeline (mgr)
- /profile, /settings

## Critical business rules
- Status transitions hardcoded: to_do→in_progress (tech only), in_progress→done (mgr only)
- SPI = completed_tasks/total_tasks / elapsed_days/total_project_days
- Health: green≥0.95, amber 0.85-0.95, red<0.85
- Circular dependency check (10 levels deep)
- Double-booking detection (non-done tasks)
- Survey phase gate: survey→approved→execution

## Test data scripts
- npm run db:seed (or bunx tsx database/setup.ts --seed)
