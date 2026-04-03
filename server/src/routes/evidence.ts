import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Allowed file extensions and their MIME types
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

// Sanitize filename: remove special chars, keep alphanumeric, dash, underscore, dot
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

// Configure multer with disk storage
const storage = multer.diskStorage({
  destination: async (req: AuthRequest, _file, cb) => {
    const taskId = req.body.task_id;
    if (!taskId) {
      return cb(new Error('task_id is required'), '');
    }

    try {
      // Get project_id from task
      const taskResult = await query<{ project_id: number }>(
        'SELECT project_id FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rowCount === 0) {
        return cb(new Error('Task not found'), '');
      }

      const projectId = taskResult.rows[0].project_id;
      const uploadDir = path.join(process.cwd(), 'uploads', 'projects', String(projectId), 'tasks', String(taskId));

      // Create directory recursively
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
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const isAllowed = Object.keys(ALLOWED_TYPES).includes(file.mimetype);
    if (!isAllowed) {
      return cb(new Error('File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel'));
    }
    cb(null, true);
  },
});

// Map MIME type to evidence type category
function getEvidenceType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'photo';
  if (mimetype === 'application/pdf') return 'document';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'document';
  return 'other';
}

// POST /api/evidence/upload - Upload file for a task
router.post(
  '/upload',
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
    const { task_id, file_type, description } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    if (!task_id) {
      res.status(400).json({ success: false, error: 'task_id is required' });
      return;
    }

    try {
      // Verify task exists
      const taskCheck = await query('SELECT id, project_id FROM tasks WHERE id = $1', [task_id]);
      if (taskCheck.rowCount === 0) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      // Build relative file path for storage in DB
      const projectId = (taskCheck.rows[0] as Record<string, unknown>).project_id;
      const relativePath = path.join('uploads', 'projects', String(projectId), 'tasks', String(task_id), file.filename)
        .replace(/\\/g, '/');

      const evidenceType = file_type || getEvidenceType(file.mimetype);
      const validTypes = ['photo', 'document', 'form', 'screenshot', 'other'];
      const finalType = validTypes.includes(evidenceType) ? evidenceType : 'other';

      const result = await query(
        `INSERT INTO task_evidence (task_id, file_path, file_name, file_type, file_size, description, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [task_id, relativePath, file.originalname, finalType, file.size, description || null, req.user!.userId]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      // Clean up file on error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      console.error('Upload evidence error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/evidence/task/:taskId - List evidence for a task
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
      const result = await query(
        `SELECT te.*, u.name AS uploaded_by_name
         FROM task_evidence te
         LEFT JOIN users u ON u.id = te.uploaded_by
         WHERE te.task_id = $1
         ORDER BY te.uploaded_at DESC`,
        [taskId]
      );

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Get evidence error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/evidence/:id/download - Download/view a specific file
router.get(
  '/:id/download',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const evidenceId = parseInt(req.params.id as string);

    if (isNaN(evidenceId)) {
      res.status(400).json({ success: false, error: 'Invalid evidence ID' });
      return;
    }

    try {
      const result = await query(
        'SELECT file_path, file_name FROM task_evidence WHERE id = $1',
        [evidenceId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Evidence not found' });
        return;
      }

      const evidence = result.rows[0] as { file_path: string; file_name: string };
      const filePath = path.join(process.cwd(), evidence.file_path);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: 'File not found on disk' });
        return;
      }

      res.download(filePath, evidence.file_name);
    } catch (err) {
      console.error('Download evidence error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// DELETE /api/evidence/:id - Delete evidence file (manager/admin)
router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const evidenceId = parseInt(req.params.id as string);

    if (isNaN(evidenceId)) {
      res.status(400).json({ success: false, error: 'Invalid evidence ID' });
      return;
    }

    try {
      const result = await query(
        'SELECT file_path FROM task_evidence WHERE id = $1',
        [evidenceId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Evidence not found' });
        return;
      }

      const evidence = result.rows[0] as { file_path: string };

      // Delete from database
      await query('DELETE FROM task_evidence WHERE id = $1', [evidenceId]);

      // Delete file from disk
      const filePath = path.join(process.cwd(), evidence.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ success: true, message: 'Evidence deleted successfully' });
    } catch (err) {
      console.error('Delete evidence error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
