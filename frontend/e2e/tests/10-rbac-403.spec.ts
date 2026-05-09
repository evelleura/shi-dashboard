import { test, expect } from '../fixtures/auth.fixture';

test('technician cannot access /dashboard', async ({ asTechnician }) => {
  await asTechnician.goto('/dashboard');
  await asTechnician.waitForURL((url) => !url.pathname.startsWith('/dashboard'), { timeout: 10000 });
  await expect(asTechnician).not.toHaveURL('/dashboard');
});

test('technician cannot access /clients', async ({ asTechnician }) => {
  await asTechnician.goto('/clients');
  // Either redirected or shows error
  await asTechnician.waitForTimeout(2000);
  const url = asTechnician.url();
  // Should not be on /clients (either redirected to /my-dashboard or /login)
  expect(url).not.toMatch(/\/clients/);
});

test('technician cannot access /users', async ({ asTechnician }) => {
  await asTechnician.goto('/users');
  await asTechnician.waitForTimeout(2000);
  const url = asTechnician.url();
  expect(url).not.toMatch(/\/users$/);
});

test('manager can access /dashboard', async ({ asManager }) => {
  await asManager.goto('/dashboard');
  await expect(asManager).toHaveURL('/dashboard', { timeout: 10000 });
});

test('manager can access /projects', async ({ asManager }) => {
  await asManager.goto('/projects');
  await expect(asManager).toHaveURL('/projects', { timeout: 10000 });
});

test('admin can access /users', async ({ asAdmin }) => {
  await asAdmin.goto('/users');
  await expect(asAdmin).not.toHaveURL('/login', { timeout: 10000 });
});
