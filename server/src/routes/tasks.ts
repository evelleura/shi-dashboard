import { Router, Response } from 'express';
import { query, getClient } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recalculateSPI } from '../services/spiCalculator';

const router = Router();

const VALID_STATUSES = ['to_do', 'working_on_it', 'done', 'stuck'];

// Valid status transitions: from -> [allowed targets]
const STATUS_TRANSITIONS: Record<string, string[]> = {
  to_do: ['working_on_it'],
  working_on_it: ['done', 'stuck'],
  done: ['working_on_it'],
  stuck: ['working_on_it'],
};

// Managers can reset any task to any status
const MANAGER_OVERRIDE_ROLES = ['manager', 'admin'];

// GET /api/tasks/project/:projectId - List tasks for a project
router.get(
  '/project/:projectId',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.projectId as string);

    if (isNaN(projectId)) {
      res.status(400).json({ success: false, error: 'Invalid project ID' });
      return;
    }

    try {
      let sql = `
        SELECT t.*,
          u.name AS assigned_to_name,
          creator.name AS created_by_name,
          COUNT(te.id)::int AS evidence_count
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN users creator ON creator.id = t.created_by
        LEFT JOIN task_evidence te ON te.task_id = t.id
        WHERE t.project_id = $1
      `;
      const params: unknown[] = [projectId];

      // Technicians only see tasks assigned to them
      if (req.user!.role === 'technician') {
        sql += ` AND t.assigned_to = $2`;
        params.push(req.user!.userId);
      }

      sql += ` GROUP BY t.id, u.name, creator.name ORDER BY t.sort_order ASC, t.created_at ASC`;

      const result = await query(sql, params);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Get tasks error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/tasks/:id - Get single task with evidence
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.id as string);

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    try {
      const taskResult = await query(
        `SELECT t.*,
          u.name AS assigned_to_name,
          creator.name AS created_by_name,
          p.name AS project_name
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN users creator ON creator.id = t.created_by
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.id = $1`,
        [taskId]
      );

      if (taskResult.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      const task = taskResult.rows[0] as Record<string, unknown>;

      // Technician can only view tasks assigned to them
      if (req.user!.role === 'technician' && task.assigned_to !== req.user!.userId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      const evidenceResult = await query(
        `SELECT te.*, u.name AS uploaded_by_name
         FROM task_evidence te
         LEFT JOIN users u ON u.id = te.uploaded_by
         WHERE te.task_id = $1
         ORDER BY te.uploaded_at DESC`,
        [taskId]
      );

      res.json({
        success: true,
        data: {
          ...task,
          evidence: evidenceResult.rows,
        },
      });
    } catch (err) {
      console.error('Get task error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/tasks - Create task (manager/admin)
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const {
      project_id, name, description, assigned_to, due_date,
      timeline_start, timeline_end, notes, budget, sort_order, is_survey_task,
    } = req.body;

    if (!project_id || !name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'project_id and name are required' });
      return;
    }

    try {
      // Verify project exists
      const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
      if (projectCheck.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      // Verify assigned_to user exists if provided
      if (assigned_to) {
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [assigned_to]);
        if (userCheck.rowCount === 0) {
          res.status(400).json({ success: false, error: 'Assigned user not found' });
          return;
        }
      }

      // Get next sort_order if not provided
      let taskSortOrder = sort_order;
      if (taskSortOrder === undefined || taskSortOrder === null) {
        const maxOrder = await query<{ max_order: string }>(
          'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tasks WHERE project_id = $1',
          [project_id]
        );
        taskSortOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;
      }

      const result = await query(
        `INSERT INTO tasks
          (project_id, name, description, assigned_to, status, due_date,
           timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, created_by)
         VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          project_id, name.trim(), description || null, assigned_to || null,
          due_date || null, timeline_start || null, timeline_end || null,
          notes || null, budget || 0, taskSortOrder, is_survey_task || false,
          req.user!.userId,
        ]
      );

      // Recalculate SPI (total_tasks changed)
      await recalculateSPI(parseInt(project_id));

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/tasks/bulk - Create multiple tasks at once
router.post(
  '/bulk',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const { project_id, tasks: taskList } = req.body;

    if (!project_id || !Array.isArray(taskList) || taskList.length === 0) {
      res.status(400).json({ success: false, error: 'project_id and tasks array are required' });
      return;
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Verify project exists
      const projectCheck = await client.query('SELECT id FROM projects WHERE id = $1', [project_id]);
      if (projectCheck.rowCount === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      // Get current max sort_order
      const maxOrder = await client.query(
        'SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM tasks WHERE project_id = $1',
        [project_id]
      );
      let nextOrder = parseInt(String(maxOrder.rows[0].max_order)) + 1;

      const created = [];
      for (const task of taskList) {
        if (!task.name || typeof task.name !== 'string' || task.name.trim().length === 0) {
          await client.query('ROLLBACK');
          res.status(400).json({ success: false, error: 'Each task must have a name' });
          return;
        }

        const result = await client.query(
          `INSERT INTO tasks
            (project_id, name, description, assigned_to, status, due_date,
             timeline_start, timeline_end, notes, budget, sort_order, is_survey_task, created_by)
           VALUES ($1, $2, $3, $4, 'to_do', $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            project_id, task.name.trim(), task.description || null, task.assigned_to || null,
            task.due_date || null, task.timeline_start || null, task.timeline_end || null,
            task.notes || null, task.budget || 0, nextOrder++,
            task.is_survey_task || false, req.user!.userId,
          ]
        );
        created.push(result.rows[0]);
      }

      await client.query('COMMIT');

      // Recalculate SPI
      await recalculateSPI(parseInt(project_id));

      res.status(201).json({ success: true, data: created });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Bulk create tasks error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// PATCH /api/tasks/:id - Update task
// Technician: status only (via PATCH /:id/status). Manager: all fields.
router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.id as string);

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    try {
      const current = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      const row = current.rows[0] as Record<string, unknown>;
      const {
        name, description, assigned_to, status, due_date,
        timeline_start, timeline_end, notes, budget, sort_order, is_survey_task,
      } = req.body;

      // Validate status if changing
      if (status !== undefined && !VALID_STATUSES.includes(status)) {
        res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        return;
      }

      const updatedName = name !== undefined ? name : row.name;
      const updatedDesc = description !== undefined ? description : row.description;
      const updatedAssigned = assigned_to !== undefined ? assigned_to : row.assigned_to;
      const updatedStatus = status !== undefined ? status : row.status;
      const updatedDueDate = due_date !== undefined ? due_date : row.due_date;
      const updatedTimelineStart = timeline_start !== undefined ? timeline_start : row.timeline_start;
      const updatedTimelineEnd = timeline_end !== undefined ? timeline_end : row.timeline_end;
      const updatedNotes = notes !== undefined ? notes : row.notes;
      const updatedBudget = budget !== undefined ? budget : row.budget;
      const updatedSortOrder = sort_order !== undefined ? sort_order : row.sort_order;
      const updatedIsSurvey = is_survey_task !== undefined ? is_survey_task : row.is_survey_task;

      const result = await query(
        `UPDATE tasks SET
          name = $1, description = $2, assigned_to = $3, status = $4,
          due_date = $5, timeline_start = $6, timeline_end = $7, notes = $8,
          budget = $9, sort_order = $10, is_survey_task = $11, updated_at = NOW()
        WHERE id = $12
        RETURNING *`,
        [
          updatedName, updatedDesc, updatedAssigned || null, updatedStatus,
          updatedDueDate || null, updatedTimelineStart || null, updatedTimelineEnd || null,
          updatedNotes || null, updatedBudget, updatedSortOrder, updatedIsSurvey, taskId,
        ]
      );

      // Recalculate SPI if status changed
      const oldStatus = row.status;
      if (status !== undefined && status !== oldStatus) {
        await recalculateSPI(row.project_id as number);
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/tasks/:id/status - Change task status (technician/manager/admin)
// Technicians can only change status of tasks assigned to them.
// Technicians follow transition rules. Managers can set any valid status.
router.patch(
  '/:id/status',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.id as string);
    const { status } = req.body;

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
      return;
    }

    try {
      const current = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      const task = current.rows[0] as Record<string, unknown>;
      const currentStatus = task.status as string;

      // Technician authorization: must be assigned to this task
      if (req.user!.role === 'technician') {
        if (task.assigned_to !== req.user!.userId) {
          res.status(403).json({ success: false, error: 'You can only change status of tasks assigned to you' });
          return;
        }

        // Enforce transition rules for technicians
        const allowed = STATUS_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
          res.status(400).json({
            success: false,
            error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`,
          });
          return;
        }
      }

      // Managers can set any valid status (override)
      if (!MANAGER_OVERRIDE_ROLES.includes(req.user!.role) && req.user!.role !== 'technician') {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      const result = await query(
        `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, taskId]
      );

      // Recalculate SPI when status changes to/from 'done'
      if (currentStatus !== status) {
        await recalculateSPI(task.project_id as number);
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Change task status error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/tasks/:id/reorder - Change sort_order (manager/admin)
router.post(
  '/:id/reorder',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.id as string);
    const { sort_order } = req.body;

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    if (sort_order === undefined || typeof sort_order !== 'number' || sort_order < 0) {
      res.status(400).json({ success: false, error: 'sort_order must be a non-negative number' });
      return;
    }

    try {
      const result = await query(
        `UPDATE tasks SET sort_order = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [sort_order, taskId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Reorder task error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// DELETE /api/tasks/:id - Delete task (manager/admin)
router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.id as string);

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    try {
      const task = await query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
      if (task.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      const projectId = (task.rows[0] as Record<string, unknown>).project_id as number;

      await query('DELETE FROM tasks WHERE id = $1', [taskId]);

      // Recalculate SPI (total_tasks changed)
      await recalculateSPI(projectId);

      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
      console.error('Delete task error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
