# Exploration Progress: Language Selector (i18n) Infrastructure

**Task:** Explore codebase for implementing language selector (Indonesia ↔ English). Map routing, theme pattern, auth structure, and hardcoded UI strings.
**Scope:** Frontend at `/Users/user/Documents/COLLEGE/Mata Kuliah/8/Tugas Akhir/coding/project_ta_dian_putri_iswandi/frontend/src`

## Completed
- ✅ Checked package.json: NO i18n library installed (no next-intl, react-i18next, i18next, next-i18next)
- ✅ Routing traced: Catch-all route at `src/app/(protected)/[...slug]/page.tsx` maps slug to 17 view components
- ✅ Theme pattern analyzed: useTheme() hook with useSyncExternalStore, localStorage key 'shi-theme', applies 'dark' class to html element
- ✅ Auth structure: User object in useAuth() from localStorage, contains id/name/email/role only (NO language/locale field)
- ✅ Hardcoded UI strings: Layout.tsx has inline labels ("Dashboard", "Projects", "Clients", etc.), TaskDetailModal, DashboardPage, etc.
- ✅ Localization in use: id-ID locale hardcoded in Layout.tsx (date/time format), TaskDetailModal (Rp currency), multiple components
- ✅ ProfilePage exists at src/views/ProfilePage.tsx - manages theme switching, could extend for language

**current_agent:** naomi (Explorer)
**last_updated:** 2026-04-26
