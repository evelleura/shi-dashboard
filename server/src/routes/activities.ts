import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { query } from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { recalculateSPI } from '../services/spiCalculator';

const router = Router();

// Allowed file extensions and their MIME types (same as evidence.ts)
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

// Configure multer with disk storage for activity file uploads
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
        'tasks', String(taskId), 'activities'
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

const VALID_ACTIVITY_TYPES = ['arrival', 'start_work', 'pause', 'resume', 'note', 'photo', 'complete'];

// GET /api/activities/task/:taskId - List activities for a task
router.get(
  '/task/:taskId',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId as string);

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    try {
      // Technician: verify assigned to this task
      if (req.user!.role === 'technician') {
        const taskCheck = await query<{ assigned_to: number }>(
          'SELECT assigned_to FROM tasks WHERE id = $1',
          [taskId]
        );
        if (taskCheck.rowCount === 0) {
          res.status(404).json({ success: false, error: 'Task not found' });
          return;
        }
        if (taskCheck.rows[0].assigned_to !== req.user!.userId) {
          res.status(403).json({ success: false, error: 'Access denied' });
          return;
        }
      }

      const result = await query(
        `SELECT a.*, u.name AS user_name
         FROM task_activities a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE a.task_id = $1
         ORDER BY a.created_at ASC`,
        [taskId]
      );

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Get activities error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/activities - Create activity (with optional file upload)
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
    const { task_id, message, activity_type } = req.body;
    const file = req.file;

    if (!task_id) {
      res.status(400).json({ success: false, error: 'task_id is required' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, error: 'message is required' });
      return;
    }

    const finalType = activity_type && VALID_ACTIVITY_TYPES.includes(activity_type)
      ? activity_type
      : 'note';

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

      // Technician: verify assigned to this task
      if (req.user!.role === 'technician' && task.assigned_to !== req.user!.userId) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(403).json({ success: false, error: 'You can only add activities to tasks assigned to you' });
        return;
      }

      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;
      let fileSize = 0;

      if (file) {
        filePath = path.join(
          'uploads', 'projects', String(task.project_id),
          'tasks', String(task_id), 'activities', file.filename
        ).replace(/\\/g, '/');
        fileName = file.originalname;
        fileType = file.mimetype;
        fileSize = file.size;
      }

      const result = await query(
        `INSERT INTO task_activities (task_id, user_id, message, activity_type, file_path, file_name, file_type, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [task_id, req.user!.userId, message.trim(), finalType, filePath, fileName, fileType, fileSize]
      );

      // Get user_name for response
      const activity = result.rows[0] as Record<string, unknown>;
      const userResult = await query<{ name: string }>('SELECT name FROM users WHERE id = $1', [req.user!.userId]);
      const userName = userResult.rows[0]?.name || null;

      res.status(201).json({
        success: true,
        data: { ...activity, user_name: userName },
      });
    } catch (err) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      console.error('Create activity error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/activities/task/:taskId/timer/start - Start timer on a task
router.post(
  '/task/:taskId/timer/start',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId as string);

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    try {
      const taskResult = await query<{
        id: number; project_id: number; assigned_to: number;
        status: string; is_tracking: boolean; time_spent_seconds: number;
      }>(
        'SELECT id, project_id, assigned_to, status, is_tracking, time_spent_seconds FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      const task = taskResult.rows[0];

      // Technician: verify assigned to this task
      if (req.user!.role === 'technician' && task.assigned_to !== req.user!.userId) {
        res.status(403).json({ success: false, error: 'You can only start timer on tasks assigned to you' });
        return;
      }

      if (task.is_tracking) {
        res.status(409).json({ success: false, error: 'Timer is already running on this task' });
        return;
      }

      // ENFORCE: Only ONE task can be tracked at a time per user.
      // Stop any currently tracking task first.
      const currentlyTracking = await query<{ id: number; timer_started_at: Date; project_id: number }>(
        `SELECT id, timer_started_at, project_id FROM tasks
         WHERE assigned_to = $1 AND is_tracking = true AND id != $2`,
        [req.user!.userId, taskId]
      );

      for (const running of currentlyTracking.rows) {
        // Stop the running task
        await query(
          `UPDATE tasks SET
            is_tracking = false,
            time_spent_seconds = time_spent_seconds + EXTRACT(EPOCH FROM (NOW() - timer_started_at))::int,
            timer_started_at = NULL,
            updated_at = NOW()
          WHERE id = $1`,
          [running.id]
        );
        const stoppedTask = await query<{ time_spent_seconds: number }>('SELECT time_spent_seconds FROM tasks WHERE id = $1', [running.id]);
        const stoppedMins = Math.round((stoppedTask.rows[0]?.time_spent_seconds ?? 0) / 60);
        await query(
          `INSERT INTO task_activities (task_id, user_id, message, activity_type)
           VALUES ($1, $2, $3, 'pause')`,
          [running.id, req.user!.userId, `Auto-paused (switched task, ${stoppedMins} min total)`]
        );
      }

      // Determine activity type: start_work if fresh, resume if has prior time
      const activityType = task.time_spent_seconds > 0 ? 'resume' : 'start_work';
      const activityMessage = task.time_spent_seconds > 0 ? 'Resumed working' : 'Started working';

      // Auto-set status to working_on_it if currently to_do
      const newStatus = task.status === 'to_do' ? 'working_on_it' : task.status;

      const updateResult = await query(
        `UPDATE tasks SET
          is_tracking = true,
          timer_started_at = NOW(),
          status = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *`,
        [newStatus, taskId]
      );

      // Insert activity log
      await query(
        `INSERT INTO task_activities (task_id, user_id, message, activity_type)
         VALUES ($1, $2, $3, $4)`,
        [taskId, req.user!.userId, activityMessage, activityType]
      );

      // Recalculate SPI if status changed
      if (task.status !== newStatus) {
        await recalculateSPI(task.project_id);
      }

      res.json({ success: true, data: updateResult.rows[0] });
    } catch (err) {
      console.error('Start timer error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/activities/task/:taskId/timer/stop - Stop timer on a task
router.post(
  '/task/:taskId/timer/stop',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId as string);

    if (isNaN(taskId)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    try {
      const taskResult = await query<{
        id: number; project_id: number; assigned_to: number;
        is_tracking: boolean; timer_started_at: Date;
      }>(
        'SELECT id, project_id, assigned_to, is_tracking, timer_started_at FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      const task = taskResult.rows[0];

      // Technician: verify assigned to this task
      if (req.user!.role === 'technician' && task.assigned_to !== req.user!.userId) {
        res.status(403).json({ success: false, error: 'You can only stop timer on tasks assigned to you' });
        return;
      }

      if (!task.is_tracking) {
        res.status(409).json({ success: false, error: 'Timer is not running on this task' });
        return;
      }

      // Calculate elapsed seconds and update task
      const updateResult = await query(
        `UPDATE tasks SET
          is_tracking = false,
          time_spent_seconds = time_spent_seconds + EXTRACT(EPOCH FROM (NOW() - timer_started_at))::int,
          timer_started_at = NULL,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [taskId]
      );

      const updatedTask = updateResult.rows[0] as Record<string, unknown>;
      const totalSeconds = updatedTask.time_spent_seconds as number;
      const minutes = Math.round(totalSeconds / 60);

      // Insert pause activity
      await query(
        `INSERT INTO task_activities (task_id, user_id, message, activity_type)
         VALUES ($1, $2, $3, $4)`,
        [taskId, req.user!.userId, `Paused work (${minutes} min total)`, 'pause']
      );

      res.json({ success: true, data: updatedTask });
    } catch (err) {
      console.error('Stop timer error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/activities/my/today - Today's activities for the current user
router.get(
  '/my/today',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await query(
        `SELECT a.*,
          t.name AS task_name,
          p.name AS project_name
        FROM task_activities a
        JOIN tasks t ON t.id = a.task_id
        JOIN projects p ON p.id = t.project_id
        WHERE a.user_id = $1
          AND a.created_at >= CURRENT_DATE
        ORDER BY a.created_at ASC`,
        [req.user!.userId]
      );

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Get my today activities error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
