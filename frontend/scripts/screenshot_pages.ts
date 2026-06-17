/**
 * Screenshot all 20 application pages for BAB V Implementasi Sistem.
 *
 * Run from frontend/ directory:
 *   cd frontend && bunx tsx ../naskah/_screenshot_pages.ts
 *
 * Requires:
 *   - Dev server running on http://localhost:3000
 *   - PostgreSQL with seeded data (admin/manager/technician users)
 *
 * Outputs to naskah/page_screenshots/ as PNG files.
 */
import { chromium, type Page, type Browser } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = resolve(__dirname, 'page_screenshots');
const VIEWPORT = { width: 1440, height: 900 };

// Test credentials (from frontend/database/seed.sql, all use 'password123')
const ADMIN = { email: 'admin@shi.co.id', password: 'password123' };
const MANAGER = { email: 'budi@shi.co.id', password: 'password123' };
const TECHNICIAN = { email: 'rizky@shi.co.id', password: 'password123' };

interface PageSpec {
  filename: string;
  url: string;
  caption: string;
  waitForSelector?: string;
}

const PUBLIC_PAGES: PageSpec[] = [
  { filename: '01_LandingPage.png',          url: '/',      caption: 'LandingPage' },
  { filename: '02_LoginPage.png',            url: '/login', caption: 'LoginPage' },
];

const MANAGER_PAGES: PageSpec[] = [
  { filename: '03_DashboardPage.png',         url: '/dashboard',     caption: 'DashboardPage' },
  { filename: '04_ProjectsPage.png',          url: '/projects',      caption: 'ProjectsPage' },
  { filename: '05_ProjectDetailPage.png',     url: '/projects/1',    caption: 'ProjectDetailPage' },
  { filename: '06_ProjectTimelinePage.png',   url: '/timeline',      caption: 'ProjectTimelinePage' },
  { filename: '07_ClientsPage.png',           url: '/clients',       caption: 'ClientsPage' },
  { filename: '08_ClientDetailPage.png',      url: '/clients/1',     caption: 'ClientDetailPage' },
  { filename: '09_ReportsPage.png',           url: '/reports',       caption: 'ReportsPage' },
  { filename: '10_SchedulePage.png',          url: '/schedule',      caption: 'SchedulePage' },
  { filename: '11_EscalationsPage.png',       url: '/escalations',   caption: 'EscalationsPage' },
  { filename: '12_TechnicianManagementPage.png', url: '/technicians', caption: 'TechnicianManagementPage' },
  { filename: '15_SettingsPage.png',          url: '/settings',      caption: 'SettingsPage' },
  { filename: '16_ProfilePage.png',           url: '/profile',       caption: 'ProfilePage' },
];

const ADMIN_PAGES: PageSpec[] = [
  { filename: '13_UserManagementPage.png', url: '/users',     caption: 'UserManagementPage' },
  { filename: '14_AuditLogPage.png',       url: '/audit-log', caption: 'AuditLogPage' },
];

const TECHNICIAN_PAGES: PageSpec[] = [
  { filename: '17_TechnicianDashboard.png',        url: '/my-dashboard',    caption: 'TechnicianDashboard' },
  { filename: '18_TechnicianProjectsPage.png',     url: '/my-projects',     caption: 'TechnicianProjectsPage' },
  { filename: '19_TechnicianTasksPage.png',        url: '/my-tasks',        caption: 'TechnicianTasksPage' },
  { filename: '20_TechnicianEscalationsPage.png',  url: '/my-escalations',  caption: 'TechnicianEscalationsPage' },
];

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from /login
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
}

async function logout(page: Page) {
  // Clear cookies and localStorage so the next login starts fresh
  await page.context().clearCookies();
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());
  } catch { /* ignore */ }
}

async function snap(page: Page, spec: PageSpec) {
  const out = join(OUT_DIR, spec.filename);
  try {
    await page.goto(`${BASE_URL}${spec.url}`, { waitUntil: 'networkidle', timeout: 30000 });
    // Give the React app a moment to settle (charts, lazy chunks)
    await page.waitForTimeout(2500);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  -> ${spec.filename}  (${spec.caption})`);
  } catch (err) {
    console.error(`  FAIL ${spec.filename}: ${(err as Error).message}`);
    // Capture whatever is on screen anyway
    try {
      await page.screenshot({ path: out, fullPage: false });
      console.log(`  (saved partial) ${spec.filename}`);
    } catch { /* nothing */ }
  }
}

async function shootGroup(browser: Browser, creds: { email: string; password: string } | null, specs: PageSpec[]) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  if (creds) {
    await login(page, creds.email, creds.password);
  }
  for (const spec of specs) {
    await snap(page, spec);
  }
  await context.close();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Output dir: ${OUT_DIR}`);

  const browser = await chromium.launch();

  // Public pages (no login)
  console.log('\n[1/4] Public pages (no auth)');
  await shootGroup(browser, null, PUBLIC_PAGES);

  // Manager
  console.log('\n[2/4] Manager pages (budi@shi.co.id)');
  await shootGroup(browser, MANAGER, MANAGER_PAGES);

  // Admin (for AuditLog + UserManagement)
  console.log('\n[3/4] Admin pages (admin@shi.co.id)');
  await shootGroup(browser, ADMIN, ADMIN_PAGES);

  // Technician
  console.log('\n[4/4] Technician pages (rizky@shi.co.id)');
  await shootGroup(browser, TECHNICIAN, TECHNICIAN_PAGES);

  await browser.close();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
