# Language Selector (i18n) Implementation Path

**Explored:** 2026-04-26 | **By:** Naomi (Explorer)
**Goal:** Map infrastructure for Indonesia ↔ English language switching

---

## 1. CURRENT STATE: i18n Libraries

**Status:** ❌ NO i18n LIBRARY INSTALLED

Checked `package.json`:
```
dependencies:
  - No next-intl, react-i18next, i18next, next-i18next
  - No next-i18next, intl-next, or similar
```

**Path:** `/Users/user/Documents/COLLEGE/Mata Kuliah/8/Tugas Akhir/coding/project_ta_dian_putri_iswandi/frontend/package.json`

**Implication:** Must implement custom Context + localStorage solution OR add a library.

---

## 2. ROUTING STRUCTURE

**Type:** Next.js 15.3.3 with App Router + Catch-all slug pattern

**Entry Point:** `/src/app/(protected)/[...slug]/page.tsx` (lines 1-46)
```
Maps slug string to 17 view components via direct import + switch
Examples:
  slug=['dashboard']        → DashboardPage
  slug=['projects', '123']  → ProjectDetailPage (id=123)
  slug=['profile']          → ProfilePage ✅ (exists)
  slug=['clients']          → ClientsPage
  slug=['schedule']         → SchedulePage
```

**Available Routes:** `/dashboard`, `/projects`, `/projects/:id`, `/clients`, `/schedule`, `/timeline`, `/reports`, `/escalations`, `/my-dashboard`, `/my-projects`, `/my-tasks`, `/my-escalations`, `/audit-log`, `/users`, `/technicians`, `/profile`

**Key Finding:** To add `/settings` route:
1. Create new view component `src/views/SettingsPage.tsx`
2. Import it in `[...slug]/page.tsx`
3. Add: `if (section === 'settings') return <SettingsPage />;`
4. Add to routes.ts: `SETTINGS: '/settings'`

---

## 3. THEME PATTERN (to copy for language)

**File:** `/src/hooks/useTheme.ts`

**Architecture:**
- ✅ Uses `useSyncExternalStore()` for client-side state sharing
- ✅ External store pattern (not Context) - avoids re-renders
- ✅ localStorage key: `'shi-theme'`
- ✅ Applies class to `document.documentElement` (html element)
- ✅ Inline script in layout.tsx (line 11) prevents flash on page load
- ✅ Fallback to system preference: `window.matchMedia('(prefers-color-scheme: dark)')`

**Pattern to Copy:**
```typescript
// Similar structure for language:
const STORAGE_KEY = 'shi-language'; // or 'shi-lang'
let currentLanguage: 'id' | 'en' = 'id';
const listeners = new Set<() => void>();

function subscribe(cb: () => void) { ... }
function getSnapshot() { return currentLanguage; }
function setLanguageValue(lang: 'id' | 'en') { ... }

export function useLanguage() {
  const lang = useSyncExternalStore(subscribe, getSnapshot);
  return { language: lang, setLanguage };
}
```

---

## 4. AUTH STRUCTURE

**File:** `/src/hooks/useAuth.ts`

**User object:** `{ id, name, email, role, is_active }`

**Key Finding:** User type at `/src/types/index.ts` (lines 15-22) has NO language/locale field.

**Options:**
1. ❌ Store language in User object (requires backend DB schema change)
2. ✅ Store language in localStorage separately (like theme)
3. ✅ Store language in useLanguage hook state

Recommended: Option 2 (localStorage) or 3 (hook state) - no backend change needed.

---

## 5. HARDCODED UI STRINGS

**All UI text is hardcoded in components** - not externalized.

Examples:
- Layout.tsx (lines 134-154): `'Dashboard'`, `'Projects'`, `'Clients'`, `'Tasks'`, `'Escalations'`, `'Reports'`, `'Timeline'`, `'Schedule'`, `'Audit'`, `'Users'`, `'Technicians'`, `'My Projects'`, `'My Tasks'`, `'Activity Log'`, `'Light Mode'`, `'Dark Mode'`, `'Logout'`
- Layout.tsx (line 224): `'Switch to light mode'` (aria-label)
- ProfilePage.tsx (lines 23, 25, 34, 40, 42): Error/success messages
- TaskDetailModal.tsx: Form labels, button text
- DashboardPage.tsx: Chart titles, headers

**Total UI strings:** ~200+ scattered across 18 view pages + 15 component files

**String pattern:** Inline JSX text, no string constants exported

**Implication:** Translation requires:
1. Creating a translation object/file (messages/en.ts, messages/id.ts)
2. Extracting strings into constants or using a t() function
3. Updating all 33 files with translation lookup

---

## 6. LOCALIZATION IN USE (Existing)

**Hardcoded id-ID locale:** Already assumes Indonesia!

Files with hardcoded `'id-ID'`:
- Layout.tsx (lines 291, 293): Date/time display `toLocaleDateString('id-ID')`
- DateRangePicker.tsx (line 118): Date formatting
- TaskDetailModal.tsx (line 19): Date + Currency `Rp ${amount.toLocaleString('id-ID')}`
- KanbanCard.tsx (lines 30, 38): Date + Currency
- TaskTable.tsx (line 217): Date formatting
- EntityActivityTimeline.tsx (line 122): Date formatting
- ActivityFeed.tsx (line 42): Time formatting

**Currency:** All budgets display as `Rp` (Indonesian Rupiah) with `toLocaleString('id-ID')`

**Implication:** Switching language means:
- Change date/time locale: `'id-ID'` → `'en-US'`
- Currency depends on language (Rp for ID, something for EN?)
- All 7+ files need locale parameter

---

## 7. LAYOUT & NAVIGATION

**File:** `/src/components/ui/Layout.tsx` (lines 1-312)

**Structure:**
- Sidebar with navigation items (NavItem interface, lines 15-20)
- Top header with GlobalSearchBar, user info, theme toggle
- Theme toggle button at line 222-235 (copy this pattern!)
- User dropdown would go near logout button (line 237-245)

**Best place for language selector:**
- Option A: Add to sidebar near theme toggle (lines 237-245) ← Recommended
- Option B: Add to ProfilePage (currently manages theme)
- Option C: Add dropdown in top-right corner near user info

**Exists:** ProfilePage.tsx already has theme switching UI (lines 5-7)
```typescript
const { theme, setTheme, isDark } = useTheme();
// Could extend this with: const { language, setLanguage } = useLanguage();
```

---

## 8. PROVIDERS STRUCTURE

**File:** `/src/app/providers.tsx`

Current: Only QueryClientProvider
```typescript
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { ... } })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

**Implication:** If using Context for language (not recommended), would need to wrap here.
Better: Use useSyncExternalStore like theme (no Context needed, no provider change).

---

## 9. VIEWS & PAGES INVENTORY

**Where strings live:**
1. `/src/views/` - 18 page components
   - DashboardPage, ProjectsPage, ProjectDetailPage, ClientsPage, LoginPage, ProfilePage
   - TechnicianDashboard, TechnicianProjectsPage, TechnicianTasksPage, TechnicianEscalationsPage
   - EscalationsPage, ReportsPage, SchedulePage, ProjectTimelinePage, AuditLogPage
   - UserManagementPage (AdminPage), TechnicianManagementPage
   - **NO SettingsPage** (need to create if adding language selector there)

2. `/src/components/` - UI components with inline text
   - ui/Layout.tsx (sidebar labels, buttons)
   - ui/GlobalSearchBar.tsx
   - ui/NotificationBell.tsx
   - tasks/TaskDetailModal.tsx
   - tasks/TaskTable.tsx
   - tasks/KanbanBoard.tsx
   - projects/ProjectForm.tsx
   - charts/* (chart labels)

---

## RECOMMENDATIONS

**Approach: Context-free language switching (like theme)**

1. ✅ Create `/src/hooks/useLanguage.ts` (copy useTheme pattern)
   - Store in localStorage key `'shi-language'`
   - Default: `'id'` (current state)
   - Support: `'id' | 'en'`
   - Use useSyncExternalStore

2. ✅ Create `/src/lib/translations.ts`
   ```typescript
   type TranslationKey = 'dashboard' | 'projects' | 'clients' | ...
   
   const messages: Record<'id' | 'en', Record<TranslationKey, string>> = {
     id: { dashboard: 'Dashboard', projects: 'Proyek', ... },
     en: { dashboard: 'Dashboard', projects: 'Projects', ... }
   };
   
   export function t(key: TranslationKey, lang: 'id' | 'en') {
     return messages[lang][key] ?? key;
   }
   ```

3. ✅ Add language selector to Layout.tsx (after theme toggle)
   - Use `useLanguage()` hook
   - Button to toggle 'id' ↔ 'en'
   - Aria-label for accessibility

4. ✅ Update all hardcoded strings
   - Replace `'Dashboard'` with `t('dashboard', language)`
   - Replace `'id-ID'` with `language === 'id' ? 'id-ID' : 'en-US'`

5. ❌ Do NOT add Context provider (theme doesn't use it)
6. ❌ Do NOT install i18n library (adds complexity, not needed)
7. ❌ Do NOT modify User table (language is UI preference, not user data)

---

## FILE INVENTORY (KEY PATHS)

**Hook:** `/src/hooks/useTheme.ts` (reference implementation)
**Component:** `/src/components/ui/Layout.tsx` (lines 222-235 for toggle pattern)
**Auth:** `/src/hooks/useAuth.ts`
**Types:** `/src/types/index.ts`
**Root layout:** `/src/app/layout.tsx`
**Providers:** `/src/app/providers.tsx`
**Profile page:** `/src/views/ProfilePage.tsx`
**Routes:** `/src/app/routes.ts`
**Protected routes:** `/src/app/(protected)/[...slug]/page.tsx`

---

## CRITICAL FINDINGS

1. **Zero i18n infrastructure** - must build from scratch
2. **Theme pattern is perfect template** - use useSyncExternalStore, localStorage
3. **All strings hardcoded** - need extraction + translation layer
4. **Locale hardcoded everywhere** - 7+ files need locale parameter
5. **ProfilePage exists** - could extend with language UI, or use Layout sidebar
6. **No backend change needed** - language is UI preference, store locally
7. **No routing changes needed** - no /settings page required (can add to Profile or Layout)

**Effort:** Medium
- Hook creation: 1 file (~30 lines)
- Translation file: 1 file (~150 lines for ~50 strings)
- Component updates: 33 files (Layout, Profile, 18 views, 14 components)
- Testing: All pages in both languages
