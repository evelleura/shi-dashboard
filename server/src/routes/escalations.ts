import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Allowed file extensions and their MIME types (same as evidence/activities)
const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

// Configure multer with disk storage for escalation file uploads
const storage = multer.diskStorage({
  destination: async (req: AuthRequest, _file, cb) => {
    const taskId = req.body.task_id;
    if (!taskId) {
      return cb(new Error('task_id is required'), '');
    }

    try {
      const taskResult = await query<{ project_id: number }>(
        'SELECT project_id FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rowCount === 0) {
        return cb(new Error('Task not found'), '');
      }

      const projectId = taskResult.rows[0].project_id;
      const uploadDir = path.join(
        process.cwd(), 'uploads', 'projects', String(projectId),
        'escalations'
      );

      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const isAllowed = Object.keys(ALLOWED_TYPES).includes(file.mimetype);
    if (!isAllowed) {
      return cb(new Error('File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel'));
    }
    cb(null, true);
  },
});

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// GET /api/escalations/summary - Count summary for dashboard badge
// Must be registered BEFORE /:id to avoid route conflict
router.get(
  '/summary',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      let result;
      if (role === 'technician') {
        result = await query(
          `SELECT
            COUNT(*) FILTER (WHERE status = 'open')::int AS open,
            COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
            COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
            COUNT(*)::int AS total
          FROM escalations WHERE reported_by = $1`,
          [userId]
        );
      } else {
        result = await query(
          `SELECT
            COUNT(*) FILTER (WHERE status = 'open')::int AS open,
            COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
            COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
            COUNT(*)::int AS total
          FROM escalations`
        );
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Escalation summary error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/escalations - Technician creates escalation
router.post(
  '/',
  authenticate,
  (req: AuthRequest, res: Response, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ success: false, error: 'File size exceeds 10MB limit' });
          return;
        }
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      if (err) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    const { task_id, title, description, priority } = req.body;
    const file = req.file;
    const userId = req.user!.userId;

    // Validate required fields
    if (!task_id) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'task_id is required' });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'title is required' });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'description is required' });
      return;
    }

    const finalPriority = priority && VALID_PRIORITIES.includes(priority)
      ? priority
      : 'medium';

    try {
      // Verify task exists and get project_id
      const taskCheck = await query<{ id: number; project_id: number; assigned_to: number }>(
        'SELECT id, project_id, assigned_to FROM tasks WHERE id = $1',
        [task_id]
      );

      if (taskCheck.rowCount === 0) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      const task = taskCheck.rows[0];

      // Technician: verify assigned to the task
      if (req.user!.role === 'technician' && task.assigned_to !== userId) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(403).json({ success: false, error: 'You can only escalate tasks assigned to you' });
        return;
      }

      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;
      let fileSize = 0;

      if (file) {
        filePath = path.join(
          'uploads', 'projects', String(task.project_id),
          'escalations', file.filename
        ).replace(/\\/g, '/');
        fileName = file.originalname;
        fileType = file.mimetype;
        fileSize = file.size;
      }

      const result = await query(
        `INSERT INTO escalations (task_id, project_id, reported_by, title, description, priority, file_path, file_name, file_type, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [task_id, task.project_id, userId, title.trim(), description.trim(), finalPriority, filePath, fileName, fileType, fileSize]
      );

      const escalation = result.rows[0] as Record<string, unknown>;

      // Fetch joined names for response
      const userResult = await query<{ name: string }>('SELECT name FROM users WHERE id = $1', [userId]);
      const taskName = await query<{ name: string }>('SELECT name FROM tasks WHERE id = $1', [task_id]);
      const projectName = await query<{ name: string }>('SELECT name FROM projects WHERE id = $1', [task.project_id]);

      res.status(201).json({
        success: true,
        data: {
          ...escalation,
          reporter_name: userResult.rows[0]?.name || null,
          task_name: taskName.rows[0]?.name || null,
          project_name: projectName.rows[0]?.name || null,
        },
      });
    } catch (err) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      console.error('Create escalation error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/escalations - List escalations
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { status: filterStatus, project_id } = req.query;

      let baseQuery = `
        SELECT e.*,
          ur.name AS reporter_name,
          uv.name AS resolver_name,
          t.name AS task_name,
          p.name AS project_name
        FROM escalations e
        LEFT JOIN users ur ON ur.id = e.reported_by
        LEFT JOIN users uv ON uv.id = e.resolved_by
        LEFT JOIN tasks t ON t.id = e.task_id
        LEFT JOIN projects p ON p.id = e.project_id
      `;

      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      // Technician: only their own escalations
      if (role === 'technician') {
        conditions.push(`e.reported_by = $${paramIdx++}`);
        params.push(userId);
      }

      // Optional status filter
      if (filterStatus && typeof filterStatus === 'string' && ['open', 'in_review', 'resolved'].includes(filterStatus)) {
        conditions.push(`e.status = $${paramIdx++}`);
        params.push(filterStatus);
      }

      // Optional project filter
      if (project_id && !isNaN(parseInt(project_id as string))) {
        conditions.push(`e.project_id = $${paramIdx++}`);
        params.push(parseInt(project_id as string));
      }

      if (conditions.length > 0) {
        baseQuery += ' WHERE ' + conditions.join(' AND ');
      }

      // Order: open first, then by priority (critical>high>medium>low), then created_at DESC
      baseQuery += `
        ORDER BY
          CASE e.status WHEN 'open' THEN 1 WHEN 'in_review' THEN 2 WHEN 'resolved' THEN 3 END,
          CASE e.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
          e.created_at DESC
      `;

      const result = await query(baseQuery, params);

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('List escalations error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/escalations/:id - Single escalation detail
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const escalationId = parseInt(req.params.id as string);

    if (isNaN(escalationId)) {
      res.status(400).json({ success: false, error: 'Invalid escalation ID' });
      return;
    }

    try {
      const result = await query(
        `SELECT e.*,
          ur.name AS reporter_name,
          uv.name AS resolver_name,
          t.name AS task_name,
          p.name AS project_name
        FROM escalations e
        LEFT JOIN users ur ON ur.id = e.reported_by
        LEFT JOIN users uv ON uv.id = e.resolved_by
        LEFT JOIN tasks t ON t.id = e.task_id
        LEFT JOIN projects p ON p.id = e.project_id
        WHERE e.id = $1`,
        [escalationId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Escalation not found' });
        return;
      }

      const escalation = result.rows[0] as Record<string, unknown>;

      // Technician: only if reported_by = userId
      if (req.user!.role === 'technician' && escalation.reported_by !== req.user!.userId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      res.json({ success: true, data: escalation });
    } catch (err) {
      console.error('Get escalation error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/escalations/:id/review - Manager marks as in_review
router.patch(
  '/:id/review',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const escalationId = parseInt(req.params.id as string);

    if (isNaN(escalationId)) {
      res.status(400).json({ success: false, error: 'Invalid escalation ID' });
      return;
    }

    try {
      const check = await query('SELECT id, status FROM escalations WHERE id = $1', [escalationId]);
      if (check.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Escalation not found' });
        return;
      }

      const current = check.rows[0] as Record<string, unknown>;
      if (current.status === 'resolved') {
        res.status(409).json({ success: false, error: 'Escalation is already resolved' });
        return;
      }

      const result = await query(
        `UPDATE escalations SET status = 'in_review', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [escalationId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Review escalation error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/escalations/:id/resolve - Manager resolves escalation
router.patch(
  '/:id/resolve',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const escalationId = parseInt(req.params.id as string);

    if (isNaN(escalationId)) {
      res.status(400).json({ success: false, error: 'Invalid escalation ID' });
      return;
    }

    const { resolution_notes } = req.body;

    if (!resolution_notes || typeof resolution_notes !== 'string' || resolution_notes.trim().length === 0) {
      res.status(400).json({ success: false, error: 'resolution_notes is required' });
      return;
    }

    try {
      const check = await query('SELECT id, status FROM escalations WHERE id = $1', [escalationId]);
      if (check.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Escalation not found' });
        return;
      }

      const current = check.rows[0] as Record<string, unknown>;
      if (current.status === 'resolved') {
        res.status(409).json({ success: false, error: 'Escalation is already resolved' });
        return;
      }

      const result = await query(
        `UPDATE escalations SET
          status = 'resolved',
          resolved_by = $1,
          resolved_at = NOW(),
          resolution_notes = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *`,
        [req.user!.userId, resolution_notes.trim(), escalationId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Resolve escalation error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
