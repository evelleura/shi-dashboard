import { test as base, Page } from '@playwright/test';
import { signTestToken } from '../helpers/jwt';
import {
  resetDatabase,
  seedUser,
  seedClient,
  seedProject,
  seedTask,
  seedProjectAssignment,
} from '../helpers/seed';

export interface TestUsers {
  technician: Record<string, unknown>;
  manager: Record<string, unknown>;
  admin: Record<string, unknown>;
}

export interface AuthFixtures {
  asManager: Page;
  asTechnician: Page;
  asAdmin: Page;
  testUsers: TestUsers;
  testData: {
    client: Record<string, unknown>;
    project: Record<string, unknown>;
    task: Record<string, unknown>;
  };
}

export const test = base.extend<AuthFixtures>({
  testUsers: async ({ browser: _browser }, use) => {
    await resetDatabase();
    const manager = await seedUser('manager', { email: 'manager@test.shi', name: 'Test Manager' });
    const technician = await seedUser('technician', { email: 'tech@test.shi', name: 'Test Tech' });
    const admin = await seedUser('admin', { email: 'admin@test.shi', name: 'Test Admin' });
    await use({ manager, technician, admin });
  },

  testData: async ({ testUsers }, use) => {
    const client = await seedClient();
    const project = await seedProject({
      clientId: client.id as number,
      managerId: testUsers.manager.id as number,
    });
    const task = await seedTask({
      projectId: project.id as number,
      assignedTo: testUsers.technician.id as number,
      managerId: testUsers.manager.id as number,
    });
    await seedProjectAssignment(project.id as number, testUsers.technician.id as number);
    await use({ client, project, task });
  },

  asManager: async ({ page, testUsers }, use) => {
    const token = signTestToken({
      userId: testUsers.manager.id as number,
      role: 'manager',
      email: testUsers.manager.email as string,
      name: testUsers.manager.name as string,
    });
    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem(
        'user',
        JSON.stringify({ id: testUsers.manager.id as number, role: 'manager', name: 'Test Manager', email: 'manager@test.shi' })
      );
    }, token);
    await use(page);
  },

  asTechnician: async ({ page, testUsers }, use) => {
    const token = signTestToken({
      userId: testUsers.technician.id as number,
      role: 'technician',
      email: testUsers.technician.email as string,
      name: testUsers.technician.name as string,
    });
    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 2, role: 'technician', name: 'Test Tech', email: 'tech@test.shi' })
      );
    }, token);
    await use(page);
  },

  asAdmin: async ({ page, testUsers }, use) => {
    const token = signTestToken({
      userId: testUsers.admin.id as number,
      role: 'admin',
      email: testUsers.admin.email as string,
      name: testUsers.admin.name as string,
    });
    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 3, role: 'admin', name: 'Test Admin', email: 'admin@test.shi' })
      );
    }, token);
    await use(page);
  },
});

export { expect } from '@playwright/test';
