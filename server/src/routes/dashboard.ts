import { Router, Response } from 'express';
import { query } from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { calculatePlannedValue } from '../services/spiCalculator';

const router = Router();

// GET /api/dashboard - Main dashboard data (manager/admin)
router.get('/', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    // All active projects sorted by urgency, with client and task info
    const projectsResult = await query(
      `SELECT
        p.id, p.name, p.description, p.client_id, p.start_date, p.end_date,
        p.duration, p.status, p.phase, p.project_value,
        c.name AS client_name,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        dr.constraints AS latest_constraints,
        dr.report_date AS last_report_date,
        dr.progress_percentage AS last_reported_progress
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
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

    // Summary stats with task counts
    const statsResult = await query(
      `SELECT
        COUNT(*)::int AS total_projects,
        COUNT(*) FILTER (WHERE p.status = 'active')::int AS active_projects,
        COUNT(*) FILTER (WHERE ph.status = 'red' AND p.status = 'active')::int AS total_red,
        COUNT(*) FILTER (WHERE ph.status = 'amber' AND p.status = 'active')::int AS total_amber,
        COUNT(*) FILTER (WHERE ph.status = 'green' AND p.status = 'active')::int AS total_green,
        COUNT(*) FILTER (WHERE ph.status IS NULL AND p.status = 'active')::int AS total_no_health,
        ROUND(AVG(ph.spi_value) FILTER (WHERE p.status = 'active'), 4) AS avg_spi,
        COUNT(*) FILTER (WHERE p.end_date < CURRENT_DATE AND p.status = 'active')::int AS overdue_projects
      FROM projects p
      LEFT JOIN project_health ph ON ph.project_id = p.id`
    );

    // Global task stats
    const taskStatsResult = await query(
      `SELECT
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS completed_tasks,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_tasks,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it' AND t.due_date < CURRENT_DATE)::int AS overtime_tasks
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.status = 'active'`
    );

    // Recent activity (last 7 days - task status changes + reports)
    const recentResult = await query(
      `(
        SELECT 'task_updated' AS type,
          t.name AS item_name,
          p.name AS project_name,
          p.id AS project_id,
          u.name AS user_name,
          t.updated_at AS activity_at,
          t.status AS detail
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.updated_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY t.updated_at DESC
        LIMIT 10
      )
      UNION ALL
      (
        SELECT 'report_submitted' AS type,
          'Daily Report' AS item_name,
          p.name AS project_name,
          p.id AS project_id,
          u.name AS user_name,
          dr.created_at AS activity_at,
          dr.progress_percentage::text AS detail
        FROM daily_reports dr
        JOIN projects p ON p.id = dr.project_id
        JOIN users u ON u.id = dr.created_by
        WHERE dr.report_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY dr.created_at DESC
        LIMIT 10
      )
      ORDER BY activity_at DESC
      LIMIT 20`
    );

    const stats = statsResult.rows[0] as Record<string, unknown>;
    const taskStats = taskStatsResult.rows[0] as Record<string, unknown>;

    res.json({
      success: true,
      data: {
        projects: projectsResult.rows,
        summary: {
          ...stats,
          total_tasks: taskStats.total_tasks,
          completed_tasks: taskStats.completed_tasks,
          working_tasks: taskStats.working_tasks,
          overtime_tasks: taskStats.overtime_tasks,
        },
        recent_activity: recentResult.rows,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/charts/tasks-by-status - Pie chart data
router.get('/charts/tasks-by-status', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        t.status,
        COUNT(*)::int AS count
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.status = 'active'
      GROUP BY t.status
      ORDER BY
        CASE t.status WHEN 'done' THEN 1 WHEN 'working_on_it' THEN 2 WHEN 'to_do' THEN 3 END`
    );

    const total = result.rows.reduce((sum, r) => sum + parseInt(String((r as Record<string, unknown>).count)), 0);

    const data = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      const count = parseInt(String(row.count));
      return {
        status: row.status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Tasks by status chart error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/charts/tasks-by-owner - Bar chart data
router.get('/charts/tasks-by-owner', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        u.id AS user_id,
        u.name,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it' AND t.due_date < CURRENT_DATE)::int AS overtime,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do
      FROM tasks t
      JOIN users u ON u.id = t.assigned_to
      JOIN projects p ON p.id = t.project_id
      WHERE p.status = 'active'
      GROUP BY u.id, u.name
      ORDER BY total DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Tasks by owner chart error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/charts/overdue-tasks - Overdue bar chart data
router.get('/charts/overdue-tasks', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        p.id AS project_id,
        p.name AS project_name,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS overdue_working,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS overdue_todo
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.due_date < CURRENT_DATE
        AND t.status NOT IN ('done')
        AND p.status = 'active'
      GROUP BY p.id, p.name
      HAVING COUNT(*) > 0
      ORDER BY COUNT(*) DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Overdue tasks chart error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/charts/tasks-by-due-date - Stacked bar chart data (by month)
router.get('/charts/tasks-by-due-date', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        TO_CHAR(t.due_date, 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_on_it,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.due_date IS NOT NULL AND p.status = 'active'
      GROUP BY TO_CHAR(t.due_date, 'YYYY-MM')
      ORDER BY month ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Tasks by due date chart error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/charts/budget-status - Budget planned vs actual
router.get('/charts/budget-status', authenticate, authorize('manager', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        p.id AS project_id,
        p.name,
        COALESCE(SUM(b.amount) FILTER (WHERE b.is_actual = false), 0)::numeric AS planned,
        COALESCE(SUM(b.amount) FILTER (WHERE b.is_actual = true), 0)::numeric AS actual
      FROM projects p
      LEFT JOIN budget_items b ON b.project_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.id, p.name
      HAVING SUM(b.amount) > 0
      ORDER BY p.name ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Budget status chart error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/charts/earned-value/:projectId - Earned value trend for a project
// Computed on read: for each week since project start, compute PV and EV
router.get('/charts/earned-value/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId as string);

  if (isNaN(projectId)) {
    res.status(400).json({ success: false, error: 'Invalid project ID' });
    return;
  }

  try {
    const projectResult = await query<{ start_date: Date; end_date: Date; status: string }>(
      'SELECT start_date, end_date, status FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    const project = projectResult.rows[0];
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const today = new Date();

    // Get total tasks count for this project
    const totalTasksResult = await query<{ total: string }>(
      'SELECT COUNT(*)::int AS total FROM tasks WHERE project_id = $1',
      [projectId]
    );
    const totalTasks = parseInt(String(totalTasksResult.rows[0].total)) || 0;

    // Generate weekly data points from start to min(today, end_date)
    const timeline: Array<{ date: string; pv: number; ev: number; spi: number }> = [];
    const dataEnd = today < endDate ? today : endDate;

    // Use weekly intervals
    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerWeek = 7 * msPerDay;
    let current = new Date(startDate);

    while (current <= dataEnd) {
      const pv = calculatePlannedValue(startDate, endDate, current);

      let ev: number;
      if (totalTasks === 0) {
        // Fallback: use daily_reports progress at this date
        const reportResult = await query<{ progress_percentage: string }>(
          `SELECT progress_percentage FROM daily_reports
           WHERE project_id = $1 AND report_date <= $2
           ORDER BY report_date DESC, created_at DESC
           LIMIT 1`,
          [projectId, current.toISOString().split('T')[0]]
        );
        ev = reportResult.rowCount && reportResult.rowCount > 0
          ? parseFloat(reportResult.rows[0].progress_percentage)
          : 0;
      } else {
        // Task-based EV: tasks completed by this date
        const completedResult = await query<{ completed: string }>(
          `SELECT COUNT(*) FILTER (WHERE status = 'done' AND updated_at <= $2)::int AS completed
           FROM tasks WHERE project_id = $1`,
          [projectId, current.toISOString()]
        );
        const completed = parseInt(String(completedResult.rows[0].completed)) || 0;
        ev = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
      }

      const spi = pv > 0 ? Math.round((ev / pv) * 10000) / 10000 : 1;

      timeline.push({
        date: current.toISOString().split('T')[0],
        pv: Math.round(pv * 100) / 100,
        ev: Math.round(ev * 100) / 100,
        spi,
      });

      current = new Date(current.getTime() + msPerWeek);
    }

    // Always include today as the last point if not already included
    if (timeline.length > 0) {
      const lastDate = timeline[timeline.length - 1].date;
      const todayStr = today.toISOString().split('T')[0];
      if (lastDate !== todayStr && today <= endDate) {
        const pv = calculatePlannedValue(startDate, endDate, today);
        let ev: number;
        if (totalTasks === 0) {
          const reportResult = await query<{ progress_percentage: string }>(
            `SELECT progress_percentage FROM daily_reports
             WHERE project_id = $1 AND report_date <= $2
             ORDER BY report_date DESC, created_at DESC
             LIMIT 1`,
            [projectId, todayStr]
          );
          ev = reportResult.rowCount && reportResult.rowCount > 0
            ? parseFloat(reportResult.rows[0].progress_percentage)
            : 0;
        } else {
          const completedResult = await query<{ completed: string }>(
            `SELECT COUNT(*) FILTER (WHERE status = 'done')::int AS completed
             FROM tasks WHERE project_id = $1`,
            [projectId]
          );
          const completed = parseInt(String(completedResult.rows[0].completed)) || 0;
          ev = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
        }
        const spi = pv > 0 ? Math.round((ev / pv) * 10000) / 10000 : 1;
        timeline.push({
          date: todayStr,
          pv: Math.round(pv * 100) / 100,
          ev: Math.round(ev * 100) / 100,
          spi,
        });
      }
    }

    res.json({
      success: true,
      data: {
        project_id: projectId,
        total_tasks: totalTasks,
        timeline,
      },
    });
  } catch (err) {
    console.error('Earned value chart error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/technician - Technician-specific dashboard
router.get('/technician', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    // My task summary
    const taskSummary = await query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_on_it,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it' AND t.due_date < CURRENT_DATE)::int AS overtime,
        COUNT(*) FILTER (WHERE t.status = 'to_do' AND t.due_date < CURRENT_DATE)::int AS over_deadline,
        COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done'))::int AS overdue
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.assigned_to = $1 AND p.status = 'active'`,
      [userId]
    );

    // My assigned projects with client info and task counts
    const assignedProjects = await query(
      `SELECT
        p.id, p.name, p.phase, p.start_date, p.end_date,
        p.target_description, p.project_value,
        c.name AS client_name, c.address AS client_address, c.phone AS client_phone,
        ph.spi_value, ph.status AS health_status,
        COUNT(t.id) FILTER (WHERE t.assigned_to = $1)::int AS my_task_count,
        COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::int AS my_completed
      FROM projects p
      JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = $1
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.phase, p.start_date, p.end_date,
        p.target_description, p.project_value,
        c.name, c.address, c.phone,
        ph.spi_value, ph.status
      ORDER BY p.end_date ASC`,
      [userId]
    );

    // All tasks assigned to this technician (with full details)
    const recentTasks = await query(
      `SELECT t.*,
        u.name AS assigned_to_name,
        p.name AS project_name,
        COUNT(te.id)::int AS evidence_count
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN task_evidence te ON te.task_id = t.id
      WHERE t.assigned_to = $1 AND p.status = 'active'
      GROUP BY t.id, u.name, p.name
      ORDER BY t.sort_order ASC, t.due_date ASC NULLS LAST`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        my_tasks: taskSummary.rows[0],
        assigned_projects: assignedProjects.rows,
        recent_tasks: recentTasks.rows,
      },
    });
  } catch (err) {
    console.error('Technician dashboard error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
