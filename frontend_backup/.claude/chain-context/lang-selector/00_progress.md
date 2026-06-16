# Language Selector Progress
Date: 2026-04-26

## Goal
Full Indonesia ↔ English translation across all UI strings.
- Stored in localStorage key 'shi-language'
- Pattern: copy useTheme() hook (useSyncExternalStore, no Context, no library)
- Settings page at /settings (new route)
- Language toggle also available in Layout sidebar near theme toggle

## Steps
- [ ] Step 1: Create useLanguage() hook + full translations object (id + en)
- [ ] Step 2: Create SettingsPage.tsx with language + theme selectors
- [ ] Step 3: Add /settings route to catch-all router
- [ ] Step 4: Add Settings link to Layout sidebar
- [ ] Step 5: Update all 33 files to use t() translation function
- [ ] Step 6: Replace all hardcoded 'id-ID' locale strings with variable
- [ ] Step 7: TypeScript check + verify

## Key Decisions
- No i18n library — use custom hook + translation object
- No backend changes — localStorage only
- SettingsPage: new page at /settings combining language + theme settings
- Translation function: t(key) returns string based on current language
