---
task_id: "20260406_0001_nextjs_migration"
agent: "sato"
phase: "implementation"
status: "COMPLETE"
timestamp: "2026-04-06T12:30:00Z"
---

# Context: Sato - Phase 3a API Migration

## Work Done

### Infrastructure Files Created
- `frontend/package.json` -- Merged deps: next@15.5.14, pg, bcryptjs, jsonwebtoken, dotenv added; vite, @vitejs/plugin-react removed; react-router-dom kept (still needed until Phase 3b)
- `frontend/next.config.ts` -- Minimal Next.js config
- `frontend/tsconfig.json` -- Next.js-compatible TypeScript config with `@/*` -> `./src/*` path alias
- `frontend/postcss.config.mjs` -- PostCSS with @tailwindcss/postcss + autoprefixer
- `frontend/src/app/layout.tsx` -- Root layout with metadata
- `frontend/src/app/globals.css` -- Tailwind v4 import
- `frontend/.env.local` -- Copied from server/.env
- `frontend/.env.example` -- Sanitized version
- `frontend/uploads/.gitkeep` -- Empty uploads directory
- `frontend/database/` -- Copied from server/database/ (schema.sql, seed.sql, setup.ts updated for tsx)

### Library Files (src/lib/)
- `src/lib/db.ts` -- pg Pool with globalThis singleton pattern for HMR safety, same config as server
- `src/lib/auth.ts` -- authenticateRequest() returns {user, errorResponse}, authorizeRoles() returns NextResponse|null
- `src/lib/spiCalculator.ts` -- Exact copy of server SPI engine, imports from local db.ts
- `src/lib/upload.ts` -- Web FormData API file upload helper (replaces multer)

### Route Handlers (50 files, 63 endpoints)
All Express routes migrated 1:1 with identical SQL queries and business logic:

| Domain | Files | Endpoints | Notes |
|--------|-------|-----------|-------|
| Auth | 2 | 2 | POST login, POST register |
| Users | 4 | 4 | GET me, GET list, GET technicians, GET me/projects |
| Clients | 2 | 5 | CRUD + list with project count |
| Projects | 6 | 10 | CRUD + assignments + auto-assign + survey approve/reject |
| Tasks | 6 | 8 | CRUD + status change + reorder + bulk create + by project |
| Evidence | 4 | 4 | Upload (FormData), list by task, download, delete |
| Materials | 3 | 4 | CRUD + list by project with totals |
| Budget | 3 | 4 | CRUD + list by project with summary |
| Activities | 5 | 5 | Create (FormData), list by task, timer start/stop, my/today |
| Escalations | 5 | 6 | CRUD (FormData for create), summary, review, resolve |
| Daily Reports | 1 | 2 | GET list + POST submit with SPI recalc |
| Dashboard | 8 | 9 | Main + technician + 6 chart endpoints + earned value |

### Key Pattern: Auth in Route Handlers
```typescript
const auth = authenticateRequest(request);
if (!auth.user) return auth.errorResponse;
const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
if (roleCheck) return roleCheck;
```

### Key Pattern: File Upload (replacing multer)
```typescript
const formData = await request.formData();
const file = formData.get('file') as File | null;
// Validate size + MIME type
const buffer = Buffer.from(await file.arrayBuffer());
fs.writeFileSync(savedPath, buffer);
```

### Key Pattern: Dynamic Route Params (Next.js 15)
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await in Next.js 15
```

## Important Note: src/ Directory Convention
Next.js auto-detected the existing `src/` directory and expects `app/` to be at `src/app/`. The `@/*` path alias resolves to `./src/*`. All new files (app/, lib/) are under `src/`.

## Files Removed
- `frontend/vite.config.ts`
- `frontend/tsconfig.node.json`
- `frontend/postcss.config.js` (replaced by postcss.config.mjs)

## Verification
- `tsc --noEmit`: 0 errors
- `next build`: Compiles successfully, types valid. Page prerendering fails on react-router usage (Phase 3b scope)
- `bun install`: All dependencies resolve cleanly

## Next Steps (Phase 3b)
- Create page files in src/app/ for each route (thin wrappers around existing components)
- Replace react-router-dom with next/navigation (useRouter, usePathname, Link)
- Update Layout.tsx imports
- Remove react-router-dom from package.json
- After Phase 3b: `next build` should succeed fully
