import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/materials/project/:projectId - List materials for a project
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
      const result = await query(
        `SELECT * FROM materials
         WHERE project_id = $1
         ORDER BY created_at ASC`,
        [projectId]
      );

      // Also compute totals
      const totals = await query<{ total_items: string; total_cost: string }>(
        `SELECT
          COUNT(*)::int AS total_items,
          COALESCE(SUM(total_price), 0)::numeric AS total_cost
        FROM materials
        WHERE project_id = $1`,
        [projectId]
      );

      res.json({
        success: true,
        data: {
          materials: result.rows,
          total_items: parseInt(String(totals.rows[0].total_items)) || 0,
          total_cost: parseFloat(String(totals.rows[0].total_cost)) || 0,
        },
      });
    } catch (err) {
      console.error('Get materials error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/materials - Add material (manager/admin)
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const { project_id, name, quantity, unit, unit_price, notes } = req.body;

    if (!project_id || !name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'project_id and name are required' });
      return;
    }

    const qty = parseFloat(quantity);
    if (quantity !== undefined && (isNaN(qty) || qty < 0)) {
      res.status(400).json({ success: false, error: 'quantity must be a non-negative number' });
      return;
    }

    const price = parseFloat(unit_price);
    if (unit_price !== undefined && (isNaN(price) || price < 0)) {
      res.status(400).json({ success: false, error: 'unit_price must be a non-negative number' });
      return;
    }

    try {
      // Verify project exists
      const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
      if (projectCheck.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      const result = await query(
        `INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          project_id, name.trim(),
          qty || 1, unit || 'pcs', price || 0,
          notes || null,
        ]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Create material error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/materials/:id - Update material (manager/admin)
router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const materialId = parseInt(req.params.id as string);

    if (isNaN(materialId)) {
      res.status(400).json({ success: false, error: 'Invalid material ID' });
      return;
    }

    const { name, quantity, unit, unit_price, notes } = req.body;

    try {
      const current = await query('SELECT * FROM materials WHERE id = $1', [materialId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Material not found' });
        return;
      }

      const row = current.rows[0] as Record<string, unknown>;

      const updatedName = name !== undefined ? name : row.name;
      const updatedQty = quantity !== undefined ? parseFloat(quantity) : row.quantity;
      const updatedUnit = unit !== undefined ? unit : row.unit;
      const updatedPrice = unit_price !== undefined ? parseFloat(unit_price) : row.unit_price;
      const updatedNotes = notes !== undefined ? notes : row.notes;

      if (!updatedName || String(updatedName).trim().length === 0) {
        res.status(400).json({ success: false, error: 'Material name cannot be empty' });
        return;
      }

      if (typeof updatedQty === 'number' && (isNaN(updatedQty) || updatedQty < 0)) {
        res.status(400).json({ success: false, error: 'quantity must be a non-negative number' });
        return;
      }

      if (typeof updatedPrice === 'number' && (isNaN(updatedPrice) || updatedPrice < 0)) {
        res.status(400).json({ success: false, error: 'unit_price must be a non-negative number' });
        return;
      }

      const result = await query(
        `UPDATE materials SET name = $1, quantity = $2, unit = $3, unit_price = $4, notes = $5
         WHERE id = $6
         RETURNING *`,
        [String(updatedName).trim(), updatedQty, updatedUnit, updatedPrice, updatedNotes, materialId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Update material error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// DELETE /api/materials/:id - Delete material (manager/admin)
router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const materialId = parseInt(req.params.id as string);

    if (isNaN(materialId)) {
      res.status(400).json({ success: false, error: 'Invalid material ID' });
      return;
    }

    try {
      const result = await query('DELETE FROM materials WHERE id = $1 RETURNING id', [materialId]);

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Material not found' });
        return;
      }

      res.json({ success: true, message: 'Material deleted successfully' });
    } catch (err) {
      console.error('Delete material error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
