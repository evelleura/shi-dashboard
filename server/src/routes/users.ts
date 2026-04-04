import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/me - Get current user info
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/users - List all users (admin/manager only)
router.get('/', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/users/technicians - List technicians (for project assignment)
router.get('/technicians', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT id, name, email FROM users WHERE role = 'technician' ORDER BY name ASC"
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get technicians error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/users/me/projects - Get projects assigned to current technician with task counts
router.get('/me/projects', authenticate, authorize('technician'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.start_date, p.end_date, p.status,
              p.phase, p.project_value,
              ph.spi_value, ph.status AS health_status,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1)::int AS my_task_count,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::int AS my_completed_tasks,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'working_on_it')::int AS my_working_tasks,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'working_on_it' AND t.due_date < CURRENT_DATE)::int AS my_overtime_tasks,
              COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.due_date < CURRENT_DATE AND t.status NOT IN ('done'))::int AS my_overdue_tasks
       FROM projects p
       JOIN project_assignments pa ON pa.project_id = p.id
       LEFT JOIN project_health ph ON ph.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE pa.user_id = $1 AND p.status = 'active'
       GROUP BY p.id, p.name, p.description, p.start_date, p.end_date, p.status,
                p.phase, p.project_value, ph.spi_value, ph.status
       ORDER BY p.end_date ASC`,
      [req.user!.userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get my projects error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
