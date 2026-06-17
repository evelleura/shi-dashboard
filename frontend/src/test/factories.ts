import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SecretDian';

export function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@shi.com',
    role: 'teknisi' as const,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeManager(overrides: Partial<Record<string, unknown>> = {}) {
  return makeUser({ id: 2, name: 'Test Manager', email: 'manager@shi.com', role: 'manajer', ...overrides });
}

export function makeAdmin(overrides: Partial<Record<string, unknown>> = {}) {
  return makeUser({ id: 3, name: 'Test Admin', email: 'admin@shi.com', role: 'admin', ...overrides });
}

export function makeClient(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    name: 'PT Test Client',
    address: 'Jl. Test No. 1',
    phone: '081234567890',
    email: 'client@test.com',
    notes: 'Test notes',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeProject(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: 1,
    project_code: 'SHI-TEST-001',
    name: 'Test Project',
    description: 'Test description',
    client_id: 1,
    start_date: now.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    status: 'active',
    phase: 'execution',
    category: 'instalasi',
    project_value: 5000000,
    survey_approved: true,
    created_by: 2,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeTask(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date();
  const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: 1,
    project_id: 1,
    name: 'Test Task',
    description: 'Test task description',
    assigned_to: 1,
    status: 'to_do',
    due_date: due.toISOString().split('T')[0],
    sort_order: 0,
    is_survey_task: false,
    status_changed_at: new Date().toISOString(),
    created_by: 2,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function signToken(payload: { userId: number; role: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function makeAuthHeader(payload: { userId: number; role: string; email: string }) {
  return `Bearer ${signToken(payload)}`;
}
