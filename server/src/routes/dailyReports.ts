import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recalculateSPI } from '../services/spiCalculator';

const router = Router();

// POST /api/daily-reports - Submit daily report (technician)
router.post('/', authenticate, authorize('technician', 'admin'), async (req: AuthRequest, res: Response) => {
  const { project_id, report_date, progress_percentage, constraints } = req.body;

  if (!project_id || !report_date || progress_percentage === undefined) {
    res.status(400).json({ success: false, error: 'project_id, report_date, and progress_percentage are required' });
    return;
  }

  const progress = parseFloat(progress_percentage);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    res.status(400).json({ success: false, error: 'progress_percentage must be between 0 and 100' });
    return;
  }

  try {
    // Verify project exists and is active
    const projectResult = await query(
      "SELECT id, status FROM projects WHERE id = $1",
      [project_id]
    );

    if (projectResult.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    if (projectResult.rows[0].status !== 'active') {
      res.status(400).json({ success: false, error: 'Can only submit reports for active projects' });
      return;
    }

    // Check if technician is assigned to this project (skip for admin)
    if (req.user!.role === 'technician') {
      const assigned = await query(
        'SELECT 1 FROM project_assignments WHERE project_id = $1 AND user_id = $2',
        [project_id, req.user!.userId]
      );
      if (assigned.rowCount === 0) {
        res.status(403).json({ success: false, error: 'You are not assigned to this project' });
        return;
      }
    }

    const result = await query(
      `INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, report_date, created_by)
       DO UPDATE SET
         progress_percentage = EXCLUDED.progress_percentage,
         constraints = EXCLUDED.constraints
       RETURNING *`,
      [project_id, report_date, progress, constraints || null, req.user!.userId]
    );

    // Trigger SPI recalculation after report submission
    const health = await recalculateSPI(parseInt(project_id));

    res.status(201).json({
      success: true,
      data: {
        report: result.rows[0],
        health,
      },
    });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/daily-reports - Get reports (manager sees all, technician sees own)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { project_id, from, to } = req.query;

  try {
    let sql = `
      SELECT dr.*, u.name AS reporter_name, p.name AS project_name
      FROM daily_reports dr
      LEFT JOIN users u ON u.id = dr.created_by
      LEFT JOIN projects p ON p.id = dr.project_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (req.user!.role === 'technician') {
      sql += ` AND dr.created_by = $${paramIndex++}`;
      params.push(req.user!.userId);
    }

    if (project_id) {
      sql += ` AND dr.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    if (from) {
      sql += ` AND dr.report_date >= $${paramIndex++}`;
      params.push(from);
    }

    if (to) {
      sql += ` AND dr.report_date <= $${paramIndex++}`;
      params.push(to);
    }

    sql += ' ORDER BY dr.report_date DESC, dr.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
