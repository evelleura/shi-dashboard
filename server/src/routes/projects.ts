import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recalculateSPI } from '../services/spiCalculator';

const router = Router();

// GET /api/projects - List all projects with health status
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        p.id, p.name, p.description, p.start_date, p.end_date, p.duration, p.status, p.created_at,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        dr.progress_percentage AS latest_progress,
        dr.constraints AS latest_constraints,
        dr.report_date AS last_report_date,
        u.name AS created_by_name
      FROM projects p
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN LATERAL (
        SELECT progress_percentage, constraints, report_date
        FROM daily_reports
        WHERE project_id = p.id
        ORDER BY report_date DESC, created_at DESC
        LIMIT 1
      ) dr ON true
      LEFT JOIN users u ON u.id = p.created_by
      ORDER BY
        CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
        p.end_date ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/projects/:id - Get single project with detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.id as string);

  try {
    const projectResult = await query(
      `SELECT
        p.*, ph.spi_value, ph.status AS health_status,
        ph.deviation_percent, ph.actual_progress, ph.planned_progress,
        ph.last_updated AS health_last_updated,
        u.name AS created_by_name
      FROM projects p
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    const reportsResult = await query(
      `SELECT dr.*, u.name AS reporter_name
       FROM daily_reports dr
       LEFT JOIN users u ON u.id = dr.created_by
       WHERE dr.project_id = $1
       ORDER BY dr.report_date DESC`,
      [projectId]
    );

    res.json({
      success: true,
      data: {
        ...projectResult.rows[0],
        daily_reports: reportsResult.rows,
      },
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/projects - Create project (manager/admin only)
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const { name, description, start_date, end_date } = req.body;

    if (!name || !start_date || !end_date) {
      res.status(400).json({ success: false, error: 'Name, start_date, and end_date are required' });
      return;
    }

    if (new Date(start_date) >= new Date(end_date)) {
      res.status(400).json({ success: false, error: 'start_date must be before end_date' });
      return;
    }

    try {
      const result = await query(
        `INSERT INTO projects (name, description, start_date, end_date, status, created_by)
         VALUES ($1, $2, $3, $4, 'active', $5)
         RETURNING *`,
        [name, description || null, start_date, end_date, req.user!.userId]
      );

      const project = result.rows[0] as { id: number };
      // Initialize health record for new project
      await recalculateSPI(project.id);

      res.status(201).json({ success: true, data: project });
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/projects/:id - Update project status (manager/admin)
router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.id as string);
    const { name, description, status } = req.body;

    const allowedStatuses = ['active', 'completed', 'on-hold'];

    try {
      const current = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      const updatedName = name ?? current.rows[0].name;
      const updatedDesc = description ?? current.rows[0].description;
      const updatedStatus = status && allowedStatuses.includes(status) ? status : current.rows[0].status;

      const result = await query(
        `UPDATE projects SET name = $1, description = $2, status = $3 WHERE id = $4 RETURNING *`,
        [updatedName, updatedDesc, updatedStatus, projectId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Update project error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/projects/:id/assignments - Get technician assignments
router.get('/:id/assignments', authenticate, authorize('manager', 'admin'), async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.id as string);

  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, pa.assigned_at
       FROM project_assignments pa
       JOIN users u ON u.id = pa.user_id
       WHERE pa.project_id = $1`,
      [projectId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/projects/:id/assignments - Assign technician to project
router.post('/:id/assignments', authenticate, authorize('manager', 'admin'), async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.id as string);
  const { user_id } = req.body;

  if (!user_id) {
    res.status(400).json({ success: false, error: 'user_id is required' });
    return;
  }

  try {
    await query(
      `INSERT INTO project_assignments (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [projectId, user_id]
    );
    res.status(201).json({ success: true, message: 'Technician assigned successfully' });
  } catch (err) {
    console.error('Assign technician error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
