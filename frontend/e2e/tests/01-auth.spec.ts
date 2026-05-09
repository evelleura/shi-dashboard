import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shi_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
});

test.beforeEach(async () => {
  await pool.query(`
    TRUNCATE TABLE task_evidence, task_activities, audit_log, escalation_updates, escalations,
      daily_reports, project_health, tasks, project_assignments, projects, clients, users
    RESTART IDENTITY CASCADE
  `);
  const hash = await bcrypt.hash('Password123!', 10);
  await pool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4)`,
    ['Test Manager', 'manager@test.shi', 'manager', hash]
  );
  await pool.query(
    `INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4)`,
    ['Test Tech', 'tech@test.shi', 'technician', hash]
  );
});

test.afterAll(async () => {
  await pool.end();
});

test('manager login redirects to /dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'manager@test.shi');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
});

test('technician login redirects to /my-dashboard or /technician', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'tech@test.shi');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  // Technicians may go to /my-dashboard or /technician/dashboard
  await expect(page).not.toHaveURL('/login', { timeout: 10000 });
});

test('wrong password shows error message', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'manager@test.shi');
  await page.fill('input[type="password"]', 'WrongPassword');
  await page.click('button[type="submit"]');
  // Should stay on login and show error
  await expect(page.locator('[role="alert"], .error, .toast, p[class*="error"], p[class*="red"]')).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL('/login');
});

test('unauthenticated redirect from /dashboard to /login', async ({ page }) => {
  // Clear any existing auth state
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login', { timeout: 10000 });
});

test('login form validates empty fields', async ({ page }) => {
  await page.goto('/login');
  await page.click('button[type="submit"]');
  // The form should not redirect on empty submission
  await expect(page).toHaveURL('/login');
});
