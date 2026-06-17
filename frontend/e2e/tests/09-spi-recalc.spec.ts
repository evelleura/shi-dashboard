import { test, expect } from '../fixtures/auth.fixture';
import { signTestToken } from '../helpers/jwt';
import { pool } from '../helpers/seed';

test('task status change triggers SPI recalculation', async ({ testUsers, testData }) => {
  // Call the API directly via fetch to change task status
  const token = signTestToken({
    userId: testUsers.manager.id as number,
    role: 'manager',
    email: testUsers.manager.email as string,
  });

  const taskId = testData.task.id as number;
  const projectId = testData.project.id as number;

  // Change task status via API
  const res = await fetch(`http://localhost:3000/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'in_progress' }),
  });

  expect(res.ok).toBe(true);

  // Verify project_health was updated
  const healthRow = await pool.query(
    'SELECT * FROM project_health WHERE project_id = $1',
    [projectId]
  );
  expect(healthRow.rows.length).toBeGreaterThanOrEqual(1);
  const health = healthRow.rows[0];
  expect(health.spi_value).toBeDefined();
  expect(typeof health.spi_value).toBe('string'); // pg returns numeric as string
});

test('marking task done updates actual_progress in project_health', async ({ testUsers, testData }) => {
  const token = signTestToken({
    userId: testUsers.manager.id as number,
    role: 'manager',
    email: testUsers.manager.email as string,
  });

  const taskId = testData.task.id as number;
  const projectId = testData.project.id as number;

  // Mark task as done
  const res = await fetch(`http://localhost:3000/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'done' }),
  });

  expect(res.ok).toBe(true);

  // Check project health shows completed task
  const healthRow = await pool.query(
    'SELECT completed_tasks, total_tasks FROM project_health WHERE project_id = $1',
    [projectId]
  );
  expect(healthRow.rows.length).toBe(1);
  expect(parseInt(healthRow.rows[0].completed_tasks)).toBe(1);
  expect(parseInt(healthRow.rows[0].total_tasks)).toBe(1);
});
