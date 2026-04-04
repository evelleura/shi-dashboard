import { Router, Response } from 'express';
import { query, getClient } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recalculateSPI } from '../services/spiCalculator';

const router = Router();

// GET /api/projects - List all projects with health status, client info, task counts
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        p.id, p.name, p.description, p.client_id, p.start_date, p.end_date,
        p.duration, p.status, p.phase, p.project_value, p.survey_approved,
        p.target_description, p.created_at, p.updated_at,
        c.name AS client_name,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        dr.progress_percentage AS latest_progress,
        dr.constraints AS latest_constraints,
        dr.report_date AS last_report_date,
        u.name AS created_by_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
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

// GET /api/projects/:id - Get single project with full detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.id as string);

  if (isNaN(projectId)) {
    res.status(400).json({ success: false, error: 'Invalid project ID' });
    return;
  }

  try {
    const projectResult = await query(
      `SELECT
        p.*,
        c.id AS client_id_ref, c.name AS client_name, c.phone AS client_phone,
        c.email AS client_email, c.address AS client_address,
        ph.spi_value, ph.status AS health_status,
        ph.deviation_percent, ph.actual_progress, ph.planned_progress,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        ph.last_updated AS health_last_updated,
        u.name AS created_by_name,
        approver.name AS survey_approved_by_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN users u ON u.id = p.created_by
      LEFT JOIN users approver ON approver.id = p.survey_approved_by
      WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    // Fetch related entities in parallel
    const [tasksResult, reportsResult, materialsResult, budgetResult, assignmentsResult] = await Promise.all([
      query(
        `SELECT t.*, u.name AS assigned_to_name,
          COUNT(te.id)::int AS evidence_count
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN task_evidence te ON te.task_id = t.id
        WHERE t.project_id = $1
        GROUP BY t.id, u.name
        ORDER BY t.sort_order ASC, t.created_at ASC`,
        [projectId]
      ),
      query(
        `SELECT dr.*, u.name AS reporter_name
         FROM daily_reports dr
         LEFT JOIN users u ON u.id = dr.created_by
         WHERE dr.project_id = $1
         ORDER BY dr.report_date DESC`,
        [projectId]
      ),
      query(
        `SELECT * FROM materials WHERE project_id = $1 ORDER BY created_at ASC`,
        [projectId]
      ),
      query(
        `SELECT * FROM budget_items WHERE project_id = $1 ORDER BY is_actual ASC, category ASC`,
        [projectId]
      ),
      query(
        `SELECT u.id, u.name, u.email, pa.assigned_at
         FROM project_assignments pa
         JOIN users u ON u.id = pa.user_id
         WHERE pa.project_id = $1`,
        [projectId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        ...projectResult.rows[0],
        tasks: tasksResult.rows,
        daily_reports: reportsResult.rows,
        materials: materialsResult.rows,
        budget_items: budgetResult.rows,
        assigned_technicians: assignmentsResult.rows,
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
    const {
      name, description, client_id, start_date, end_date,
      project_value, target_description, phase,
    } = req.body;

    if (!name || !start_date || !end_date) {
      res.status(400).json({ success: false, error: 'Name, start_date, and end_date are required' });
      return;
    }

    if (new Date(start_date) >= new Date(end_date)) {
      res.status(400).json({ success: false, error: 'start_date must be before end_date' });
      return;
    }

    // Validate client_id if provided
    if (client_id) {
      try {
        const clientCheck = await query('SELECT id FROM clients WHERE id = $1', [client_id]);
        if (clientCheck.rowCount === 0) {
          res.status(400).json({ success: false, error: 'Client not found' });
          return;
        }
      } catch (err) {
        console.error('Client check error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
      }
    }

    const projectPhase = phase === 'execution' ? 'execution' : 'survey';

    try {
      const result = await query(
        `INSERT INTO projects
          (name, description, client_id, start_date, end_date, status, phase,
           project_value, target_description, created_by)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9)
         RETURNING *`,
        [
          name, description || null, client_id || null,
          start_date, end_date, projectPhase,
          project_value || 0, target_description || null,
          req.user!.userId,
        ]
      );

      const project = result.rows[0] as { id: number };
      // Initialize health record
      await recalculateSPI(project.id);

      res.status(201).json({ success: true, data: project });
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/projects/:id - Update project (manager/admin)
router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.id as string);

    if (isNaN(projectId)) {
      res.status(400).json({ success: false, error: 'Invalid project ID' });
      return;
    }

    const {
      name, description, status, client_id, start_date, end_date,
      project_value, target_description, phase,
    } = req.body;

    const allowedStatuses = ['active', 'completed', 'on-hold', 'cancelled'];
    const allowedPhases = ['survey', 'execution'];

    try {
      const current = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      const row = current.rows[0] as Record<string, unknown>;

      const updatedName = name !== undefined ? name : row.name;
      const updatedDesc = description !== undefined ? description : row.description;
      const updatedStatus = status && allowedStatuses.includes(status) ? status : row.status;
      const updatedClientId = client_id !== undefined ? client_id : row.client_id;
      const updatedStartDate = start_date !== undefined ? start_date : row.start_date;
      const updatedEndDate = end_date !== undefined ? end_date : row.end_date;
      const updatedValue = project_value !== undefined ? project_value : row.project_value;
      const updatedTarget = target_description !== undefined ? target_description : row.target_description;
      const updatedPhase = phase && allowedPhases.includes(phase) ? phase : row.phase;

      // Validate dates if either changed
      if (start_date || end_date) {
        if (new Date(updatedStartDate as string) >= new Date(updatedEndDate as string)) {
          res.status(400).json({ success: false, error: 'start_date must be before end_date' });
          return;
        }
      }

      const result = await query(
        `UPDATE projects SET
          name = $1, description = $2, status = $3, client_id = $4,
          start_date = $5, end_date = $6, project_value = $7,
          target_description = $8, phase = $9, updated_at = NOW()
        WHERE id = $10
        RETURNING *`,
        [
          updatedName, updatedDesc, updatedStatus, updatedClientId || null,
          updatedStartDate, updatedEndDate, updatedValue,
          updatedTarget, updatedPhase, projectId,
        ]
      );

      // Recalculate SPI if dates or status changed
      if (start_date || end_date || status) {
        await recalculateSPI(projectId);
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Update project error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// DELETE /api/projects/:id - Delete project (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.id as string);

    if (isNaN(projectId)) {
      res.status(400).json({ success: false, error: 'Invalid project ID' });
      return;
    }

    try {
      const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [projectId]);

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
      console.error('Delete project error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/projects/:id/assignments - Get technician assignments
router.get('/:id/assignments', authenticate, authorize('manager', 'admin'), async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.id as string);

  if (isNaN(projectId)) {
    res.status(400).json({ success: false, error: 'Invalid project ID' });
    return;
  }

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
    // Verify user exists and is a technician
    const userCheck = await query("SELECT id, role FROM users WHERE id = $1", [user_id]);
    if (userCheck.rowCount === 0) {
      res.status(400).json({ success: false, error: 'User not found' });
      return;
    }

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

// DELETE /api/projects/:id/assignments/:userId - Unassign technician
router.delete(
  '/:id/assignments/:userId',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.id as string);
    const userId = parseInt(req.params.userId as string);

    if (isNaN(projectId) || isNaN(userId)) {
      res.status(400).json({ success: false, error: 'Invalid project or user ID' });
      return;
    }

    try {
      const result = await query(
        'DELETE FROM project_assignments WHERE project_id = $1 AND user_id = $2 RETURNING project_id',
        [projectId, userId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Assignment not found' });
        return;
      }

      res.json({ success: true, message: 'Technician unassigned successfully' });
    } catch (err) {
      console.error('Unassign technician error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/projects/:id/auto-assign - Auto-assign technicians to tasks
// Round-robin distribution of unassigned tasks across specified technicians
router.post(
  '/:id/auto-assign',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.id as string);
    const { user_ids } = req.body;

    if (isNaN(projectId)) {
      res.status(400).json({ success: false, error: 'Invalid project ID' });
      return;
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      res.status(400).json({ success: false, error: 'user_ids array is required and must not be empty' });
      return;
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get unassigned tasks for this project
      const unassigned = await client.query(
        `SELECT id FROM tasks WHERE project_id = $1 AND assigned_to IS NULL ORDER BY sort_order ASC`,
        [projectId]
      );

      if (unassigned.rowCount === 0) {
        await client.query('COMMIT');
        res.json({ success: true, data: { assigned_count: 0 }, message: 'No unassigned tasks found' });
        return;
      }

      // Round-robin assignment
      let assignedCount = 0;
      for (let i = 0; i < unassigned.rows.length; i++) {
        const taskId = (unassigned.rows[i] as { id: number }).id;
        const userId = user_ids[i % user_ids.length];
        await client.query(
          'UPDATE tasks SET assigned_to = $1, updated_at = NOW() WHERE id = $2',
          [userId, taskId]
        );
        assignedCount++;
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: { assigned_count: assignedCount },
        message: `${assignedCount} tasks assigned to ${user_ids.length} technicians`,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Auto-assign error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// POST /api/projects/:id/approve-survey - Approve survey, transition to execution
router.post(
  '/:id/approve-survey',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.id as string);

    if (isNaN(projectId)) {
      res.status(400).json({ success: false, error: 'Invalid project ID' });
      return;
    }

    try {
      const current = await query('SELECT phase, survey_approved FROM projects WHERE id = $1', [projectId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      const project = current.rows[0] as { phase: string; survey_approved: boolean };

      if (project.phase !== 'survey') {
        res.status(400).json({ success: false, error: 'Project is not in survey phase' });
        return;
      }

      if (project.survey_approved) {
        res.status(400).json({ success: false, error: 'Survey already approved' });
        return;
      }

      const result = await query(
        `UPDATE projects SET
          phase = 'execution',
          survey_approved = TRUE,
          survey_approved_by = $1,
          survey_approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *`,
        [req.user!.userId, projectId]
      );

      res.json({ success: true, data: result.rows[0], message: 'Survey approved. Project moved to execution phase.' });
    } catch (err) {
      console.error('Approve survey error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/projects/:id/reject-survey - Reject survey (technician must redo)
router.post(
  '/:id/reject-survey',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.id as string);
    const { reason } = req.body;

    if (isNaN(projectId)) {
      res.status(400).json({ success: false, error: 'Invalid project ID' });
      return;
    }

    try {
      const current = await query('SELECT phase FROM projects WHERE id = $1', [projectId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      const project = current.rows[0] as { phase: string };

      if (project.phase !== 'survey') {
        res.status(400).json({ success: false, error: 'Project is not in survey phase' });
        return;
      }

      // Reset survey tasks to 'to_do' status
      await query(
        `UPDATE tasks SET status = 'to_do', updated_at = NOW()
         WHERE project_id = $1 AND is_survey_task = TRUE AND status = 'done'`,
        [projectId]
      );

      // Recalculate SPI after task reset
      await recalculateSPI(projectId);

      res.json({
        success: true,
        message: 'Survey rejected. Survey tasks have been reset.',
        data: { reason: reason || 'No reason provided' },
      });
    } catch (err) {
      console.error('Reject survey error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
