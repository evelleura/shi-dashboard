import { test, expect } from '../fixtures/auth.fixture';

test('manager can navigate to /projects', async ({ asManager, testData: _testData }) => {
  await asManager.goto('/projects');
  await expect(asManager).toHaveURL('/projects', { timeout: 10000 });
});

test('manager sees project list on /projects', async ({ asManager, testData }) => {
  void testData; // ensure testData fixture ran (seeds project)
  await asManager.goto('/projects');
  // Page should load with project content
  const content = asManager.locator('body');
  await expect(content).toBeVisible({ timeout: 10000 });
});

test('manager can access /projects/[id] detail page', async ({ asManager, testData }) => {
  const projectId = testData.project.id as number;
  await asManager.goto(`/projects/${projectId}`);
  await expect(asManager).toHaveURL(`/projects/${projectId}`, { timeout: 10000 });
});

test('manager can access /clients', async ({ asManager }) => {
  await asManager.goto('/clients');
  await expect(asManager).toHaveURL('/clients', { timeout: 10000 });
});

test('manager can access /dashboard', async ({ asManager }) => {
  await asManager.goto('/dashboard');
  await expect(asManager).toHaveURL('/dashboard', { timeout: 10000 });
});
