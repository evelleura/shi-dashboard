# Yamamoto Strategy: E2E + Unit Test Architecture

## Framework Decisions (FINAL)
- E2E: Playwright 1.49+
- Unit/Integration: Vitest 2.1+ (v8 coverage)
- Component: Vitest + @testing-library/react + jsdom
- Coverage merge: monocart-coverage-reports
- Package manager: bun

## devDependencies to install
vitest@^2.1.8, @vitest/coverage-v8@^2.1.8, @testing-library/react@^16.1.0,
@testing-library/jest-dom@^6.6.3, @testing-library/user-event@^14.5.2,
jsdom@^25.0.1, @playwright/test@^1.49.1,
monocart-reporter@^2.9.0, monocart-coverage-reports@^2.12.0

## DB Isolation
- Separate test DB: shi_test
- .env.test: DB_NAME=shi_test
- truncate-between-spec strategy (not per-test)
- Programmatic seeding via direct pg (NOT db:seed script)

## Auth in Tests
- Only auth.spec.ts uses actual login form
- ALL other E2E specs inject JWT via page.addInitScript + localStorage

## Coverage Path to 99%
- Vitest (handlers + lib + services + hooks + utils + components) → ~78%
- Playwright E2E (charts + kanban + pages) → +21%
- Targeted gap tests → +1% = 99% total

## Coverage Exclusions
- src/types/**, src/app/routes.ts, src/app/layout.tsx, src/app/providers.tsx
- src/components/charts/**, src/components/maps/**
- *.config.*, **/*.d.ts, .next/**, public/**, uploads/**, database/**

## Thresholds
lines: 99, branches: 95, functions: 99, statements: 99

## Build Order for Nakamura
1. devDeps + configs (vitest.config.ts, playwright.config.ts, .env.test)
2. Test setup files (src/test/setup.ts, render.tsx, factories.ts)
3. E2E helpers (jwt.ts, seed.ts, api.ts, selectors.ts, fixtures)
4. Handler tests (12 files — highest coverage impact)
5. Lib unit tests (spiCalculator, auth)
6. Service + hook + utils tests
7. Component tests (forms, modals, badges, tables)
8. 12 E2E specs
9. Patch coverage gaps
