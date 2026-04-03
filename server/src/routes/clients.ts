import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/clients - List all clients with project count
router.get(
  '/',
  authenticate,
  authorize('manager', 'admin'),
  async (_req: AuthRequest, res: Response) => {
    try {
      const result = await query(
        `SELECT c.*,
          u.name AS created_by_name,
          COUNT(p.id)::int AS project_count
        FROM clients c
        LEFT JOIN users u ON u.id = c.created_by
        LEFT JOIN projects p ON p.client_id = c.id
        GROUP BY c.id, u.name
        ORDER BY c.name ASC`
      );

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Get clients error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/clients/:id - Get single client with projects
router.get(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const clientId = parseInt(req.params.id as string);

    if (isNaN(clientId)) {
      res.status(400).json({ success: false, error: 'Invalid client ID' });
      return;
    }

    try {
      const clientResult = await query(
        `SELECT c.*, u.name AS created_by_name
         FROM clients c
         LEFT JOIN users u ON u.id = c.created_by
         WHERE c.id = $1`,
        [clientId]
      );

      if (clientResult.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Client not found' });
        return;
      }

      const projectsResult = await query(
        `SELECT p.id, p.name, p.status, p.phase, p.start_date, p.end_date, p.project_value,
                ph.spi_value, ph.status AS health_status
         FROM projects p
         LEFT JOIN project_health ph ON ph.project_id = p.id
         WHERE p.client_id = $1
         ORDER BY p.created_at DESC`,
        [clientId]
      );

      res.json({
        success: true,
        data: {
          ...clientResult.rows[0],
          projects: projectsResult.rows,
        },
      });
    } catch (err) {
      console.error('Get client error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/clients - Create client
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const { name, address, phone, email, notes } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Client name is required' });
      return;
    }

    try {
      const result = await query(
        `INSERT INTO clients (name, address, phone, email, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name.trim(), address || null, phone || null, email || null, notes || null, req.user!.userId]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Create client error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/clients/:id - Update client
router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const clientId = parseInt(req.params.id as string);

    if (isNaN(clientId)) {
      res.status(400).json({ success: false, error: 'Invalid client ID' });
      return;
    }

    const { name, address, phone, email, notes } = req.body;

    try {
      const current = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Client not found' });
        return;
      }

      const row = current.rows[0] as Record<string, unknown>;
      const updatedName = (name !== undefined ? name : row.name) as string;
      const updatedAddress = address !== undefined ? address : row.address;
      const updatedPhone = phone !== undefined ? phone : row.phone;
      const updatedEmail = email !== undefined ? email : row.email;
      const updatedNotes = notes !== undefined ? notes : row.notes;

      if (!updatedName || updatedName.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Client name cannot be empty' });
        return;
      }

      const result = await query(
        `UPDATE clients
         SET name = $1, address = $2, phone = $3, email = $4, notes = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [updatedName.trim(), updatedAddress, updatedPhone, updatedEmail, updatedNotes, clientId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Update client error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// DELETE /api/clients/:id - Delete client (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: AuthRequest, res: Response) => {
    const clientId = parseInt(req.params.id as string);

    if (isNaN(clientId)) {
      res.status(400).json({ success: false, error: 'Invalid client ID' });
      return;
    }

    try {
      const result = await query('DELETE FROM clients WHERE id = $1 RETURNING id', [clientId]);

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Client not found' });
        return;
      }

      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (err) {
      console.error('Delete client error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
