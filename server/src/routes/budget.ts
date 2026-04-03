import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/budget/project/:projectId - List budget items (planned + actual)
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
        `SELECT * FROM budget_items
         WHERE project_id = $1
         ORDER BY is_actual ASC, category ASC, created_at ASC`,
        [projectId]
      );

      // Compute summary: planned total, actual total, by category
      const summaryResult = await query<{
        planned_total: string;
        actual_total: string;
      }>(
        `SELECT
          COALESCE(SUM(amount) FILTER (WHERE is_actual = false), 0)::numeric AS planned_total,
          COALESCE(SUM(amount) FILTER (WHERE is_actual = true), 0)::numeric AS actual_total
        FROM budget_items
        WHERE project_id = $1`,
        [projectId]
      );

      const categoryResult = await query(
        `SELECT
          category,
          COALESCE(SUM(amount) FILTER (WHERE is_actual = false), 0)::numeric AS planned,
          COALESCE(SUM(amount) FILTER (WHERE is_actual = true), 0)::numeric AS actual
        FROM budget_items
        WHERE project_id = $1
        GROUP BY category
        ORDER BY category ASC`,
        [projectId]
      );

      const summary = summaryResult.rows[0];

      res.json({
        success: true,
        data: {
          items: result.rows,
          summary: {
            planned_total: parseFloat(String(summary.planned_total)) || 0,
            actual_total: parseFloat(String(summary.actual_total)) || 0,
            variance: (parseFloat(String(summary.planned_total)) || 0) - (parseFloat(String(summary.actual_total)) || 0),
            by_category: categoryResult.rows,
          },
        },
      });
    } catch (err) {
      console.error('Get budget items error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/budget - Add budget item (manager/admin)
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const { project_id, category, description, amount, is_actual } = req.body;

    if (!project_id || !category || typeof category !== 'string' || category.trim().length === 0) {
      res.status(400).json({ success: false, error: 'project_id and category are required' });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (amount === undefined || isNaN(parsedAmount) || parsedAmount < 0) {
      res.status(400).json({ success: false, error: 'amount must be a non-negative number' });
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
        `INSERT INTO budget_items (project_id, category, description, amount, is_actual)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [project_id, category.trim(), description || null, parsedAmount, is_actual || false]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Create budget item error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// PATCH /api/budget/:id - Update budget item (manager/admin)
router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const budgetId = parseInt(req.params.id as string);

    if (isNaN(budgetId)) {
      res.status(400).json({ success: false, error: 'Invalid budget item ID' });
      return;
    }

    const { category, description, amount, is_actual } = req.body;

    try {
      const current = await query('SELECT * FROM budget_items WHERE id = $1', [budgetId]);
      if (current.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Budget item not found' });
        return;
      }

      const row = current.rows[0] as Record<string, unknown>;

      const updatedCategory = category !== undefined ? category : row.category;
      const updatedDesc = description !== undefined ? description : row.description;
      const updatedAmount = amount !== undefined ? parseFloat(amount) : row.amount;
      const updatedIsActual = is_actual !== undefined ? is_actual : row.is_actual;

      if (!updatedCategory || String(updatedCategory).trim().length === 0) {
        res.status(400).json({ success: false, error: 'Category cannot be empty' });
        return;
      }

      if (typeof updatedAmount === 'number' && (isNaN(updatedAmount) || updatedAmount < 0)) {
        res.status(400).json({ success: false, error: 'amount must be a non-negative number' });
        return;
      }

      const result = await query(
        `UPDATE budget_items SET category = $1, description = $2, amount = $3, is_actual = $4
         WHERE id = $5
         RETURNING *`,
        [String(updatedCategory).trim(), updatedDesc, updatedAmount, updatedIsActual, budgetId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Update budget item error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// DELETE /api/budget/:id - Delete budget item (manager/admin)
router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req: AuthRequest, res: Response) => {
    const budgetId = parseInt(req.params.id as string);

    if (isNaN(budgetId)) {
      res.status(400).json({ success: false, error: 'Invalid budget item ID' });
      return;
    }

    try {
      const result = await query('DELETE FROM budget_items WHERE id = $1 RETURNING id', [budgetId]);

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Budget item not found' });
        return;
      }

      res.json({ success: true, message: 'Budget item deleted successfully' });
    } catch (err) {
      console.error('Delete budget item error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
