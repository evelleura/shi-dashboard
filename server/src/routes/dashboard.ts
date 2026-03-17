import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard - Aggregated dashboard data (manager only)
router.get('/', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    // All active projects sorted by urgency
    const projectsResult = await query(
      `SELECT
        p.id, p.name, p.description, p.start_date, p.end_date, p.duration, p.status,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        dr.constraints AS latest_constraints,
        dr.report_date AS last_report_date,
        dr.progress_percentage AS last_reported_progress
      FROM projects p
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN LATERAL (
        SELECT constraints, report_date, progress_percentage
        FROM daily_reports
        WHERE project_id = p.id
        ORDER BY report_date DESC, created_at DESC
        LIMIT 1
      ) dr ON true
      WHERE p.status = 'active'
      ORDER BY
        CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
        ph.spi_value ASC NULLS LAST,
        p.end_date ASC`
    );

    // Summary stats
    const statsResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE p.status = 'active') AS total_active,
        COUNT(*) FILTER (WHERE ph.status = 'red' AND p.status = 'active') AS total_red,
        COUNT(*) FILTER (WHERE ph.status = 'amber' AND p.status = 'active') AS total_amber,
        COUNT(*) FILTER (WHERE ph.status = 'green' AND p.status = 'active') AS total_green,
        COUNT(*) FILTER (WHERE ph.status IS NULL AND p.status = 'active') AS total_no_report,
        ROUND(AVG(ph.spi_value) FILTER (WHERE p.status = 'active'), 4) AS avg_spi
      FROM projects p
      LEFT JOIN project_health ph ON ph.project_id = p.id`
    );

    // Recent reports (last 7 days)
    const recentResult = await query(
      `SELECT dr.id, dr.project_id, p.name AS project_name,
              dr.report_date, dr.progress_percentage, dr.constraints,
              u.name AS reporter_name
       FROM daily_reports dr
       JOIN projects p ON p.id = dr.project_id
       JOIN users u ON u.id = dr.created_by
       WHERE dr.report_date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY dr.report_date DESC, dr.created_at DESC
       LIMIT 20`
    );

    res.json({
      success: true,
      data: {
        projects: projectsResult.rows,
        summary: statsResult.rows[0],
        recent_reports: recentResult.rows,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
