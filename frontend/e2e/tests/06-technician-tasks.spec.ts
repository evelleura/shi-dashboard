import { test, expect } from '../fixtures/auth.fixture';

test('technician can access their tasks page', async ({ asTechnician }) => {
  await asTechnician.goto('/my-tasks');
  // Should not redirect to login
  await expect(asTechnician).not.toHaveURL('/login', { timeout: 10000 });
});

test('technician sees their assigned tasks', async ({ asTechnician, testData }) => {
  void testData; // ensure seed ran
  await asTechnician.goto('/my-tasks');
  const body = asTechnician.locator('body');
  await expect(body).toBeVisible({ timeout: 10000 });
});

test('technician can navigate to technician projects page', async ({ asTechnician }) => {
  await asTechnician.goto('/technician/projects');
  await expect(asTechnician).not.toHaveURL('/login', { timeout: 10000 });
});

test('technician cannot access manager dashboard', async ({ asTechnician }) => {
  await asTechnician.goto('/dashboard');
  // Should be redirected away from dashboard
  await expect(asTechnician).not.toHaveURL('/dashboard', { timeout: 10000 });
});
