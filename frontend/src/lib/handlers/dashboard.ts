import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query } from '@/lib/db';
import { calculatePlannedValue } from '@/lib/spiCalculator';

export async function getDashboard(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  // Filter: projects whose timeline overlaps the selected date range
  const dateParams: string[] = [];
  let dateClause = '';
  if (startDate && endDate) {
    dateParams.push(startDate, endDate);
    dateClause = ` AND p.start_date <= $${dateParams.length} AND p.end_date >= $${dateParams.length - 1}`;
  }

  try {
    const projectsResult = await query(
      `SELECT p.id, p.name, p.description, p.client_id, p.start_date, p.end_date,
        p.duration, p.status, p.phase, p.project_value,
        c.name AS client_name,
        ph.spi_value, ph.status AS health_status, ph.deviation_percent,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        dr.constraints AS latest_constraints, dr.report_date AS last_report_date,
        dr.progress_percentage AS last_reported_progress
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_health ph ON ph.project_id = p.id
      LEFT JOIN LATERAL (
        SELECT constraints, report_date, progress_percentage FROM daily_reports
        WHERE project_id = p.id ORDER BY report_date DESC, created_at DESC LIMIT 1
      ) dr ON true
      WHERE p.status = 'active'${dateClause}
      ORDER BY
        CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
        ph.spi_value ASC NULLS LAST, p.end_date ASC`,
      dateParams.length ? [dateParams[0], dateParams[1]] : []
    );

    // Stats also scoped to filtered projects
    const statsParams: string[] = [];
    let statsDateClause = '';
    if (startDate && endDate) {
      statsParams.push(startDate, endDate);
      statsDateClause = ` AND p.start_date <= $2 AND p.end_date >= $1`;
    }

    const [statsResult, taskStatsResult, recentResult, escalationSummary] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total_projects,
          COUNT(*) FILTER (WHERE p.status = 'active')::int AS active_projects,
          COUNT(*) FILTER (WHERE ph.status = 'red' AND p.status = 'active')::int AS total_red,
          COUNT(*) FILTER (WHERE ph.status = 'amber' AND p.status = 'active')::int AS total_amber,
          COUNT(*) FILTER (WHERE ph.status = 'green' AND p.status = 'active')::int AS total_green,
          COUNT(*) FILTER (WHERE ph.status IS NULL AND p.status = 'active')::int AS total_no_health,
          ROUND(AVG(ph.spi_value) FILTER (WHERE p.status = 'active'), 4) AS avg_spi,
          COUNT(*) FILTER (WHERE p.end_date < CURRENT_DATE AND p.status = 'active')::int AS overdue_projects
         FROM projects p LEFT JOIN project_health ph ON ph.project_id = p.id
         WHERE 1=1${statsDateClause}`,
        statsParams
      ),
      query(
        `SELECT COUNT(*)::int AS total_tasks,
          COUNT(*) FILTER (WHERE t.status = 'done')::int AS completed_tasks,
          COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress_tasks,
          COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_tasks,
          COUNT(*) FILTER (WHERE t.status = 'review')::int AS review_tasks,
          COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS overtime_tasks
         FROM tasks t JOIN projects p ON p.id = t.project_id
         WHERE p.status = 'active'${statsDateClause}`,
        statsParams
      ),
      query(
        `(SELECT 'task_updated' AS type, t.name AS item_name, p.name AS project_name,
            p.id AS project_id, u.name AS user_name, t.updated_at AS activity_at, t.status AS detail
          FROM tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assigned_to
          WHERE t.updated_at >= CURRENT_DATE - INTERVAL '7 days' ORDER BY t.updated_at DESC LIMIT 10)
         UNION ALL
         (SELECT 'report_submitted' AS type, 'Daily Report' AS item_name, p.name AS project_name,
            p.id AS project_id, u.name AS user_name, dr.created_at AS activity_at, dr.progress_percentage::text AS detail
          FROM daily_reports dr JOIN projects p ON p.id = dr.project_id JOIN users u ON u.id = dr.created_by
          WHERE dr.report_date >= CURRENT_DATE - INTERVAL '7 days' ORDER BY dr.created_at DESC LIMIT 10)
         ORDER BY activity_at DESC LIMIT 20`
      ),
      query(`SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
               COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review FROM escalations`),
    ]);

    const stats = statsResult.rows[0] as Record<string, unknown>;
    const taskStats = taskStatsResult.rows[0] as Record<string, unknown>;
    const escStats = escalationSummary.rows[0] as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        projects: projectsResult.rows,
        summary: { ...stats, ...taskStats, open_escalations: escStats.open, in_review_escalations: escStats.in_review },
        recent_activity: recentResult.rows,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getTechnicianDashboard(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const userId = auth.user.userId;
  try {
    const [taskSummary, assignedProjects, recentTasks, completedProjects, myEscalations] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do,
          COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
          COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_on_it,
          COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
          COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
          COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS overtime,
          COUNT(*) FILTER (WHERE t.status = 'to_do' AND t.due_date < CURRENT_DATE)::int AS over_deadline,
          COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done'))::int AS overdue
         FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.assigned_to = $1 AND p.status = 'active'`,
        [userId]
      ),
      query(
        `SELECT p.id, p.name, p.phase, p.start_date, p.end_date, p.target_description, p.project_value,
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
         GROUP BY p.id, p.name, p.phase, p.start_date, p.end_date, p.target_description, p.project_value,
           c.name, c.address, c.phone, ph.spi_value, ph.status
         ORDER BY p.end_date ASC`,
        [userId]
      ),
      query(
        `SELECT t.*, u.name AS assigned_to_name, p.name AS project_name,
          COUNT(te.id)::int AS evidence_count,
          (SELECT COUNT(*)::int FROM task_activities WHERE task_id = t.id) AS activity_count
         FROM tasks t JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.assigned_to
         LEFT JOIN task_evidence te ON te.task_id = t.id
         WHERE t.assigned_to = $1 AND p.status = 'active'
         GROUP BY t.id, u.name, p.name ORDER BY t.sort_order ASC, t.due_date ASC NULLS LAST`,
        [userId]
      ),
      query(
        `SELECT p.id, p.name, p.phase, p.start_date, p.end_date, p.status,
          c.name AS client_name, c.address AS client_address,
          COUNT(t.id) FILTER (WHERE t.assigned_to = $1)::int AS my_task_count,
          COUNT(t.id) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::int AS my_completed
         FROM projects p
         JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = $1
         LEFT JOIN clients c ON c.id = p.client_id LEFT JOIN tasks t ON t.project_id = p.id
         WHERE p.status IN ('completed', 'on-hold', 'cancelled')
         GROUP BY p.id, p.name, p.phase, p.start_date, p.end_date, p.status, c.name, c.address
         ORDER BY p.updated_at DESC`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
          COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review,
          COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved
         FROM escalations WHERE reported_by = $1`,
        [userId]
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        my_tasks: taskSummary.rows[0],
        assigned_projects: assignedProjects.rows,
        completed_projects: completedProjects.rows,
        recent_tasks: recentTasks.rows,
        escalation_summary: myEscalations.rows[0],
      },
    });
  } catch (err) {
    console.error('Technician dashboard error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartOverdueTasks(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const params: string[] = [];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND p.start_date <= $2 AND p.end_date >= $1`;
    }
    const result = await query(
      `SELECT p.id AS project_id, p.name AS project_name,
        COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress'))::int AS overdue_working,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS overdue_todo
       FROM tasks t JOIN projects p ON p.id = t.project_id
       WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done') AND p.status = 'active'${dateClause}
       GROUP BY p.id, p.name HAVING COUNT(*) > 0 ORDER BY COUNT(*) DESC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Overdue tasks chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartTasksByDueDate(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const params: string[] = [];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND t.due_date BETWEEN $1 AND $2`;
    }
    const result = await query(
      `SELECT TO_CHAR(t.due_date, 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working_on_it,
        COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done
       FROM tasks t JOIN projects p ON p.id = t.project_id
       WHERE t.due_date IS NOT NULL AND p.status = 'active'${dateClause}
       GROUP BY TO_CHAR(t.due_date, 'YYYY-MM') ORDER BY month ASC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Tasks by due date chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartTasksByOwner(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const params: string[] = [];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND p.start_date <= $2 AND p.end_date >= $1`;
    }
    const result = await query(
      `SELECT u.id AS user_id, u.name, COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
        COUNT(*) FILTER (WHERE t.status = 'working_on_it')::int AS working,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS overtime,
        COUNT(*) FILTER (WHERE t.status = 'to_do')::int AS to_do
       FROM tasks t JOIN users u ON u.id = t.assigned_to JOIN projects p ON p.id = t.project_id
       WHERE p.status = 'active'${dateClause} GROUP BY u.id, u.name ORDER BY total DESC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Tasks by owner chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartTasksByStatus(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const params: string[] = [];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND p.start_date <= $2 AND p.end_date >= $1`;
    }
    const result = await query(
      `SELECT t.status, COUNT(*)::int AS count
       FROM tasks t JOIN projects p ON p.id = t.project_id
       WHERE p.status = 'active'${dateClause}
       GROUP BY t.status
       ORDER BY CASE t.status WHEN 'done' THEN 1 WHEN 'review' THEN 2 WHEN 'working_on_it' THEN 3 WHEN 'in_progress' THEN 4 WHEN 'to_do' THEN 5 END`,
      params
    );
    const total = result.rows.reduce((sum, r) => sum + parseInt(String((r as Record<string, unknown>).count)), 0);
    const data = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      const count = parseInt(String(row.count));
      return { status: row.status, count, percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 };
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Tasks by status chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartEarnedValue(request: NextRequest, projectId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(projectId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });

  try {
    const projectResult = await query<{ start_date: Date; end_date: Date; status: string }>(
      'SELECT start_date, end_date, status FROM projects WHERE id = $1', [id]
    );
    if (projectResult.rowCount === 0) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    const project = projectResult.rows[0];
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const today = new Date();

    const totalTasksResult = await query<{ total: string }>('SELECT COUNT(*)::int AS total FROM tasks WHERE project_id = $1', [id]);
    const totalTasks = parseInt(String(totalTasksResult.rows[0].total)) || 0;

    const timeline: Array<{ date: string; pv: number; ev: number; spi: number }> = [];
    const dataEnd = today < endDate ? today : endDate;
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    let current = new Date(startDate);

    const getEV = async (date: Date): Promise<number> => {
      if (totalTasks === 0) {
        const reportResult = await query<{ progress_percentage: string }>(
          `SELECT progress_percentage FROM daily_reports WHERE project_id = $1 AND report_date <= $2
           ORDER BY report_date DESC, created_at DESC LIMIT 1`,
          [id, date.toISOString().split('T')[0]]
        );
        return reportResult.rowCount && reportResult.rowCount > 0 ? parseFloat(reportResult.rows[0].progress_percentage) : 0;
      } else {
        const completedResult = await query<{ completed: string }>(
          `SELECT COUNT(*) FILTER (WHERE status = 'done' AND updated_at <= $2)::int AS completed FROM tasks WHERE project_id = $1`,
          [id, date.toISOString()]
        );
        const completed = parseInt(String(completedResult.rows[0].completed)) || 0;
        return totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
      }
    };

    while (current <= dataEnd) {
      const pv = calculatePlannedValue(startDate, endDate, current);
      const ev = await getEV(current);
      const spi = pv > 0 ? Math.round((ev / pv) * 10000) / 10000 : 1;
      timeline.push({ date: current.toISOString().split('T')[0], pv: Math.round(pv * 100) / 100, ev: Math.round(ev * 100) / 100, spi });
      current = new Date(current.getTime() + msPerWeek);
    }

    if (timeline.length > 0) {
      const todayStr = today.toISOString().split('T')[0];
      if (timeline[timeline.length - 1].date !== todayStr && today <= endDate) {
        const pv = calculatePlannedValue(startDate, endDate, today);
        const ev = await getEV(today);
        const spi = pv > 0 ? Math.round((ev / pv) * 10000) / 10000 : 1;
        timeline.push({ date: todayStr, pv: Math.round(pv * 100) / 100, ev: Math.round(ev * 100) / 100, spi });
      }
    }

    return NextResponse.json({ success: true, data: { project_id: id, total_tasks: totalTasks, timeline } });
  } catch (err) {
    console.error('Earned value chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function globalSearch(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '10') || 10));

  if (!q) return NextResponse.json({ success: true, data: [] });

  const term = `%${q}%`;
  const { role, userId } = auth.user;

  try {
    if (role === 'manager' || role === 'admin') {
      const [projectRows, taskRows, clientRows] = await Promise.all([
        query<{ id: number; name: string; project_code: string | null; status: string }>(
          `SELECT id, name, project_code, status FROM projects
           WHERE name ILIKE $1 OR project_code ILIKE $1
           ORDER BY name ASC LIMIT $2`,
          [term, limit]
        ),
        query<{ id: number; name: string; project_id: number; project_name: string; status: string }>(
          `SELECT t.id, t.name, t.project_id, p.name AS project_name, t.status
           FROM tasks t JOIN projects p ON p.id = t.project_id
           WHERE t.name ILIKE $1
           ORDER BY t.name ASC LIMIT $2`,
          [term, limit]
        ),
        query<{ id: number; name: string; email: string | null }>(
          `SELECT id, name, email FROM clients WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY name ASC LIMIT $2`,
          [term, limit]
        ),
      ]);

      const results: Array<{ type: string; id: number; name: string; subtitle: string; url: string }> = [
        ...projectRows.rows.map((r) => ({
          type: 'project',
          id: r.id,
          name: r.name,
          subtitle: r.project_code ? `${r.project_code} · ${r.status}` : r.status,
          url: `/projects/${r.id}`,
        })),
        ...taskRows.rows.map((r) => ({
          type: 'task',
          id: r.id,
          name: r.name,
          subtitle: `${r.project_name} · ${r.status}`,
          url: `/projects/${r.project_id}?task=${r.id}`,
        })),
        ...clientRows.rows.map((r) => ({
          type: 'client',
          id: r.id,
          name: r.name,
          subtitle: r.email ?? '',
          url: `/clients/${r.id}`,
        })),
      ];

      return NextResponse.json({ success: true, data: results });
    }

    // Technician: own tasks + assigned projects only
    const [taskRows, projectRows] = await Promise.all([
      query<{ id: number; name: string; project_id: number; project_name: string; status: string }>(
        `SELECT t.id, t.name, t.project_id, p.name AS project_name, t.status
         FROM tasks t JOIN projects p ON p.id = t.project_id
         WHERE t.assigned_to = $1 AND t.name ILIKE $2
         ORDER BY t.name ASC LIMIT $3`,
        [userId, term, limit]
      ),
      query<{ id: number; name: string; status: string }>(
        `SELECT p.id, p.name, p.status
         FROM projects p JOIN project_assignments pa ON pa.project_id = p.id
         WHERE pa.user_id = $1 AND p.name ILIKE $2
         ORDER BY p.name ASC LIMIT $3`,
        [userId, term, limit]
      ),
    ]);

    const results: Array<{ type: string; id: number; name: string; subtitle: string; url: string }> = [
      ...taskRows.rows.map((r) => ({
        type: 'task',
        id: r.id,
        name: r.name,
        subtitle: `${r.project_name} · ${r.status}`,
        url: `/technician/projects/${r.project_id}?task=${r.id}`,
      })),
      ...projectRows.rows.map((r) => ({
        type: 'project',
        id: r.id,
        name: r.name,
        subtitle: r.status,
        url: `/technician/projects/${r.id}`,
      })),
    ];

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error('Global search error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartProjectCategories(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const params: string[] = [];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND start_date <= $2 AND end_date >= $1`;
    }

    const result = await query(
      `SELECT category, COUNT(*)::int AS count
       FROM projects
       WHERE status = 'active'${dateClause}
       GROUP BY category
       ORDER BY count DESC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Project categories chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartTechnicianWorkload(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const params: string[] = [];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND t.due_date BETWEEN $1 AND $2`;
    }

    const result = await query(
      `SELECT u.id AS user_id, u.name,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE t.status IN ('in_progress', 'working_on_it'))::int AS in_progress,
        COUNT(*) FILTER (WHERE t.status IN ('working_on_it', 'in_progress') AND t.due_date < CURRENT_DATE)::int AS overtime
       FROM tasks t
       JOIN users u ON u.id = t.assigned_to
       JOIN projects p ON p.id = t.project_id
       WHERE p.status = 'active'${dateClause}
       GROUP BY u.id, u.name
       ORDER BY total DESC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Technician workload chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartSPITrend(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const params: string[] = [];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND ph.last_updated BETWEEN $1 AND $2`;
    }

    const result = await query(
      `SELECT DATE_TRUNC('week', ph.last_updated)::date AS week_start,
        ROUND(AVG(ph.spi_value)::numeric, 4) AS avg_spi,
        COUNT(*)::int AS project_count
       FROM project_health ph
       JOIN projects p ON p.id = ph.project_id
       WHERE p.status = 'active'${dateClause}
       GROUP BY DATE_TRUNC('week', ph.last_updated)
       ORDER BY week_start ASC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('SPI trend chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function chartRecentActivity(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
  if (roleCheck) return roleCheck;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '20') || 20));

  try {
    let dateClause: string;
    const params: (string | number)[] = [limit];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = `activity_at BETWEEN $2 AND $3`;
    } else {
      dateClause = `activity_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    const result = await query(
      `SELECT * FROM (
        (SELECT 'task_created' AS type, t.name AS item_name, p.name AS project_name,
            p.id AS project_id, u.name AS user_name, t.created_at AS activity_at, t.status AS detail
          FROM tasks t
          JOIN projects p ON p.id = t.project_id
          LEFT JOIN users u ON u.id = t.assigned_to
          ORDER BY t.created_at DESC LIMIT 50)
        UNION ALL
        (SELECT 'task_updated' AS type, t.name AS item_name, p.name AS project_name,
            p.id AS project_id, u.name AS user_name, t.updated_at AS activity_at, t.status AS detail
          FROM tasks t
          JOIN projects p ON p.id = t.project_id
          LEFT JOIN users u ON u.id = t.assigned_to
          WHERE t.updated_at <> t.created_at
          ORDER BY t.updated_at DESC LIMIT 50)
        UNION ALL
        (SELECT 'escalation_opened' AS type, e.title AS item_name, p.name AS project_name,
            p.id AS project_id, u.name AS user_name, e.created_at AS activity_at, e.status AS detail
          FROM escalations e
          JOIN projects p ON p.id = e.project_id
          JOIN users u ON u.id = e.reported_by
          ORDER BY e.created_at DESC LIMIT 50)
        UNION ALL
        (SELECT 'report_submitted' AS type, 'Daily Report' AS item_name, p.name AS project_name,
            p.id AS project_id, u.name AS user_name, dr.created_at AS activity_at,
            dr.progress_percentage::text AS detail
          FROM daily_reports dr
          JOIN projects p ON p.id = dr.project_id
          JOIN users u ON u.id = dr.created_by
          ORDER BY dr.created_at DESC LIMIT 50)
      ) combined
      WHERE ${dateClause}
      ORDER BY activity_at DESC
      LIMIT $1`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Recent activity chart error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function technicianProductivity(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const { userId } = auth.user;

  try {
    const params: (string | number)[] = [userId];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND t.updated_at BETWEEN $2 AND $3`;
    }

    const result = await query(
      `SELECT DATE_TRUNC('week', t.updated_at)::date AS week_start,
        COUNT(*)::int AS completed
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = $1 AND t.status = 'done'${dateClause}
       GROUP BY DATE_TRUNC('week', t.updated_at)
       ORDER BY week_start ASC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Technician productivity error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function technicianTimeSpent(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const { userId } = auth.user;

  try {
    const params: (string | number)[] = [userId];
    let dateClause = '';
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateClause = ` AND t.updated_at BETWEEN $2 AND $3`;
    }

    const result = await query(
      `SELECT p.id AS project_id, p.name AS project_name,
        ROUND(COALESCE(SUM(t.time_spent_seconds), 0) / 3600.0, 1) AS hours
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = $1 AND t.time_spent_seconds > 0${dateClause}
       GROUP BY p.id, p.name
       ORDER BY hours DESC`,
      params
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Technician time spent error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
