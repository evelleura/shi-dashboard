import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { query, getClient } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';
import { logChange } from './audit';
import { createNotification } from './notifications';

// Kolom tb_proyek di-alias balik ke nama JS (id, name, client_id) supaya lapisan
// UI/tipe tidak berubah. Tabel fisik pakai nama naskah (Tabel 4.11).
const PROYEK_COLS = `p.id_proyek AS id, p.project_code, p.nama_proyek AS name, p.description,
  p.id_klien AS client_id, p.start_date, p.end_date, p.duration, p.status, p.phase, p.category,
  p.project_value, p.survey_approved, p.survey_approved_by, p.survey_approved_at,
  p.target_description, p.created_by, p.created_at, p.updated_at`;
const PROYEK_RETURNING = `RETURNING id_proyek AS id, project_code, nama_proyek AS name, description,
  id_klien AS client_id, start_date, end_date, duration, status, phase, category, project_value,
  survey_approved, survey_approved_by, survey_approved_at, target_description, created_by, created_at, updated_at`;

async function generateProjectCode(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `SHI-${yy}${mm}`;

  // Find the highest sequence number for this month
  const result = await query<{ max_seq: string }>(
    `SELECT MAX(SUBSTRING(project_code FROM $1))::int AS max_seq
     FROM tb_proyek WHERE project_code LIKE $2`,
    [`^${prefix}(\\d+)$`, `${prefix}%`]
  );
  const nextSeq = ((result.rows[0]?.max_seq as unknown as number) || 0) + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

export async function listProjects(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const result = await query(
      `SELECT ${PROYEK_COLS},
        c.nama_klien AS client_name,
        ph.spi_value, ph.status AS health_status,
        ph.actual_progress, ph.planned_progress, ph.last_updated AS health_last_updated,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        dr.progress_percentage AS latest_progress,
        dr.constraints AS latest_constraints, dr.report_date AS last_report_date,
        u.nama AS created_by_name
      FROM tb_proyek p
      LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
      LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
      LEFT JOIN LATERAL (
        SELECT progress_percentage, constraints, report_date
        FROM daily_reports WHERE project_id = p.id_proyek
        ORDER BY report_date DESC, created_at DESC LIMIT 1
      ) dr ON true
      LEFT JOIN tb_user u ON u.id_user = p.created_by
      ORDER BY
        CASE ph.status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
        p.end_date ASC`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get projects error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function createProject(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, description, client_id, start_date, end_date, project_value, target_description, phase, category } = body;
  const allowedCategories = ['instalasi', 'maintenance', 'perbaikan', 'upgrade', 'monitoring', 'security', 'networking', 'lainnya'];

  if (!name || !start_date || !end_date) {
    return NextResponse.json({ success: false, error: 'Name, start_date, and end_date are required' }, { status: 400 });
  }
  if (new Date(start_date) >= new Date(end_date)) {
    return NextResponse.json({ success: false, error: 'start_date must be before end_date' }, { status: 400 });
  }
  if (client_id) {
    const clientCheck = await query('SELECT id_klien FROM tb_klien WHERE id_klien = $1', [client_id]);
    if (clientCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 400 });
    }
  }

  try {
    const projectCode = await generateProjectCode();
    const validCategory = category && allowedCategories.includes(category) ? category : 'instalasi';
    const result = await query(
      `INSERT INTO tb_proyek (project_code, nama_proyek, description, id_klien, start_date, end_date, status, phase, category,
         project_value, target_description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11)
       ${PROYEK_RETURNING}`,
      [projectCode, name, description || null, client_id || null, start_date, end_date,
       phase === 'execution' ? 'execution' : 'survey', validCategory, project_value || 0, target_description || null, auth.user.userId]
    );
    const project = result.rows[0] as { id: number; name: string };
    await recalculateSPI(project.id);
    const creatorName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'project',
      entityId: project.id,
      entityName: project.name,
      action: 'create',
      changes: [{ field: '*', oldValue: null, newValue: project.name }],
      userId: auth.user.userId,
      userName: creatorName,
    });
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (err) {
    console.error('Create project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getProject(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const projectResult = await query(
      `SELECT ${PROYEK_COLS}, c.id_klien AS client_id_ref, c.nama_klien AS client_name, c.no_telp AS client_phone,
        c.email AS client_email, c.alamat AS client_address,
        ph.spi_value, ph.status AS health_status, ph.actual_progress, ph.planned_progress,
        ph.total_tasks, ph.completed_tasks, ph.working_tasks, ph.overtime_tasks, ph.overdue_tasks,
        ph.last_updated AS health_last_updated,
        u.nama AS created_by_name, approver.nama AS survey_approved_by_name
      FROM tb_proyek p
      LEFT JOIN tb_klien c ON c.id_klien = p.id_klien
      LEFT JOIN project_health ph ON ph.project_id = p.id_proyek
      LEFT JOIN tb_user u ON u.id_user = p.created_by
      LEFT JOIN tb_user approver ON approver.id_user = p.survey_approved_by
      WHERE p.id_proyek = $1`,
      [projectId]
    );
    if (projectResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const [tasksResult, reportsResult, assignmentsResult] = await Promise.all([
      query(
        `SELECT t.id_tugas AS id, t.id_proyek AS project_id, t.nama_tugas AS name, t.description,
           t.assigned_to, t.status, t.due_date, t.timeline_start, t.timeline_end, t.notes,
           t.sort_order, t.is_survey_task, t.time_spent_seconds, t.estimated_hours, t.depends_on,
           t.status_changed_at, t.created_by, t.created_at, t.updated_at,
           u.nama AS assigned_to_name, COUNT(te.id_bukti)::int AS evidence_count
         FROM tb_tugas t LEFT JOIN tb_user u ON u.id_user = t.assigned_to
         LEFT JOIN tb_bukti te ON te.id_tugas = t.id_tugas
         WHERE t.id_proyek = $1 GROUP BY t.id_tugas, u.nama ORDER BY t.sort_order ASC, t.created_at ASC`,
        [projectId]
      ),
      query(
        `SELECT dr.*, u.nama AS reporter_name FROM daily_reports dr
         LEFT JOIN tb_user u ON u.id_user = dr.created_by
         WHERE dr.project_id = $1 ORDER BY dr.report_date DESC`,
        [projectId]
      ),
      query(
        `SELECT u.id_user AS id, u.nama AS name, u.email, pa.assigned_at FROM tb_penugasan_proyek pa
         JOIN tb_user u ON u.id_user = pa.id_user WHERE pa.id_proyek = $1`,
        [projectId]
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...projectResult.rows[0],
        tasks: tasksResult.rows,
        daily_reports: reportsResult.rows,
        assigned_technicians: assignmentsResult.rows,
      },
    });
  } catch (err) {
    console.error('Get project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateProject(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, description, status, client_id, start_date, end_date, project_value, target_description, phase, category } = body;
  const allowedStatuses = ['active', 'completed', 'on-hold'];
  const allowedPhases = ['survey', 'execution'];
  const allowedCats = ['instalasi', 'maintenance', 'perbaikan', 'upgrade', 'monitoring', 'security', 'networking', 'lainnya'];

  try {
    const current = await query(
      `SELECT id_proyek AS id, project_code, nama_proyek AS name, description, id_klien AS client_id,
        start_date, end_date, duration, status, phase, category, project_value, survey_approved,
        survey_approved_by, survey_approved_at, target_description, created_by, created_at, updated_at
       FROM tb_proyek WHERE id_proyek = $1`,
      [projectId]
    );
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const row = current.rows[0] as Record<string, unknown>;
    const updatedStartDate = start_date !== undefined ? start_date : row.start_date;
    const updatedEndDate = end_date !== undefined ? end_date : row.end_date;
    if (start_date || end_date) {
      if (new Date(updatedStartDate as string) >= new Date(updatedEndDate as string)) {
        return NextResponse.json({ success: false, error: 'start_date must be before end_date' }, { status: 400 });
      }
    }
    const result = await query(
      `UPDATE tb_proyek SET nama_proyek=$1, description=$2, status=$3, id_klien=$4,
        start_date=$5, end_date=$6, project_value=$7, target_description=$8, phase=$9, category=$10, updated_at=NOW()
       WHERE id_proyek=$11
       ${PROYEK_RETURNING}`,
      [
        name !== undefined ? name : row.name,
        description !== undefined ? description : row.description,
        status && allowedStatuses.includes(status) ? status : row.status,
        client_id !== undefined ? client_id || null : row.client_id,
        updatedStartDate, updatedEndDate,
        project_value !== undefined ? project_value : row.project_value,
        target_description !== undefined ? target_description : row.target_description,
        phase && allowedPhases.includes(phase) ? phase : row.phase,
        category && allowedCats.includes(category) ? category : row.category,
        projectId,
      ]
    );
    if (start_date || end_date || status) await recalculateSPI(projectId);
    const updated = result.rows[0] as Record<string, unknown>;
    const userName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    const auditFields = ['name', 'description', 'status', 'client_id', 'start_date', 'end_date', 'project_value', 'target_description', 'phase', 'category'];
    const changes = auditFields
      .filter(f => String(updated[f] ?? '') !== String(row[f] ?? ''))
      .map(f => ({ field: f, oldValue: String(row[f] ?? ''), newValue: String(updated[f] ?? '') }));
    if (changes.length > 0) {
      await logChange({
        entityType: 'project',
        entityId: projectId,
        entityName: String(updated.name),
        action: 'update',
        changes,
        userId: auth.user.userId,
        userName,
      });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteProject(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const existing = await query('SELECT id_proyek AS id, nama_proyek AS name FROM tb_proyek WHERE id_proyek = $1', [projectId]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const existingProject = existing.rows[0] as { id: number; name: string };
    const result = await query('DELETE FROM tb_proyek WHERE id_proyek = $1 RETURNING id_proyek AS id', [projectId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const deleterName = (await query('SELECT nama AS name FROM tb_user WHERE id_user = $1', [auth.user.userId])).rows[0]?.name as string || 'Unknown';
    await logChange({
      entityType: 'project',
      entityId: projectId,
      entityName: existingProject.name,
      action: 'delete',
      changes: [{ field: '*', oldValue: existingProject.name, newValue: null }],
      userId: auth.user.userId,
      userName: deleterName,
    });
    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function approveSurvey(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const current = await query('SELECT phase, survey_approved FROM tb_proyek WHERE id_proyek = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const project = current.rows[0] as { phase: string; survey_approved: boolean };
    if (project.phase !== 'survey') {
      return NextResponse.json({ success: false, error: 'Project is not in survey phase' }, { status: 400 });
    }
    if (project.survey_approved) {
      return NextResponse.json({ success: false, error: 'Survey already approved' }, { status: 400 });
    }
    // Block approval if survey tasks exist but are not all done
    const surveyTaskCheck = await query(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'done')::int AS done_count
       FROM tb_tugas WHERE id_proyek = $1 AND is_survey_task = TRUE`,
      [projectId]
    );
    const { total: surveyTotal, done_count: surveyDone } = surveyTaskCheck.rows[0] as { total: number; done_count: number };
    if (surveyTotal === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada tugas survei yang dibuat. Buat dan selesaikan tugas survei terlebih dahulu.',
      }, { status: 400 });
    }
    if (surveyDone < surveyTotal) {
      return NextResponse.json({
        success: false,
        error: `Survei belum selesai. ${surveyDone} dari ${surveyTotal} tugas survei selesai. Selesaikan semua tugas survei sebelum menyetujui.`,
      }, { status: 400 });
    }
    const result = await query(
      `UPDATE tb_proyek SET phase='execution', survey_approved=TRUE,
        survey_approved_by=$1, survey_approved_at=NOW(), updated_at=NOW()
       WHERE id_proyek=$2
       ${PROYEK_RETURNING}`,
      [auth.user.userId, projectId]
    );
    return NextResponse.json({
      success: true, data: result.rows[0],
      message: 'Survey approved. Project moved to execution phase.',
    });
  } catch (err) {
    console.error('Approve survey error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function rejectSurvey(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const current = await query('SELECT phase FROM tb_proyek WHERE id_proyek = $1', [projectId]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    if ((current.rows[0] as { phase: string }).phase !== 'survey') {
      return NextResponse.json({ success: false, error: 'Project is not in survey phase' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const reason = (body as Record<string, string>).reason;
    await query(
      `UPDATE tb_tugas SET status='to_do', updated_at=NOW()
       WHERE id_proyek=$1 AND is_survey_task=TRUE AND status='done'`,
      [projectId]
    );
    await recalculateSPI(projectId);
    return NextResponse.json({
      success: true, message: 'Survey rejected. Survey tasks have been reset.',
      data: { reason: reason || 'No reason provided' },
    });
  } catch (err) {
    console.error('Reject survey error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function autoAssign(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  const body = await request.json();
  const { user_ids } = body;
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ success: false, error: 'user_ids array is required and must not be empty' }, { status: 400 });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const unassigned = await client.query(
      'SELECT id_tugas AS id FROM tb_tugas WHERE id_proyek = $1 AND assigned_to IS NULL ORDER BY sort_order ASC',
      [projectId]
    );
    if (unassigned.rowCount === 0) {
      await client.query('COMMIT');
      return NextResponse.json({ success: true, data: { assigned_count: 0 }, message: 'No unassigned tasks found' });
    }
    let assignedCount = 0;
    for (let i = 0; i < unassigned.rows.length; i++) {
      await client.query(
        'UPDATE tb_tugas SET assigned_to=$1, updated_at=NOW() WHERE id_tugas=$2',
        [user_ids[i % user_ids.length], (unassigned.rows[i] as { id: number }).id]
      );
      assignedCount++;
    }
    await client.query('COMMIT');
    return NextResponse.json({
      success: true, data: { assigned_count: assignedCount },
      message: `${assignedCount} tasks assigned to ${user_ids.length} technicians`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Auto-assign error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function listAssignments(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT u.id_user AS id, u.nama AS name, u.email, pa.assigned_at FROM tb_penugasan_proyek pa
       JOIN tb_user u ON u.id_user = pa.id_user WHERE pa.id_proyek = $1`,
      [projectId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get assignments error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function assignTechnician(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  const body = await request.json();
  const { user_id } = body;
  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
  }

  try {
    const userCheck = await query('SELECT id_user FROM tb_user WHERE id_user = $1', [user_id]);
    if (userCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 400 });
    }
    await query(
      'INSERT INTO tb_penugasan_proyek (id_proyek, id_user) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [projectId, user_id]
    );
    const projRow = await query('SELECT nama_proyek AS name FROM tb_proyek WHERE id_proyek = $1', [projectId]);
    const projectName = (projRow.rows[0]?.name as string) ?? 'Proyek';
    await createNotification({
      userId: parseInt(String(user_id)),
      type: 'project_assigned',
      title: `Kamu ditambahkan ke proyek: ${projectName}`,
      body: 'Kamu sekarang menjadi bagian dari tim proyek ini',
      entityType: 'project',
      entityId: projectId,
      projectId: projectId,
    });
    return NextResponse.json({ success: true, message: 'Technician assigned successfully' }, { status: 201 });
  } catch (err) {
    console.error('Assign technician error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getProjectTechniciansWithMetrics(request: NextRequest, id: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT u.id_user AS id, u.nama AS name, u.email,
        COUNT(t.id_tugas)::int AS total_tasks,
        COUNT(t.id_tugas) FILTER (WHERE t.status = 'done')::int AS completed_tasks,
        COUNT(t.id_tugas) FILTER (WHERE t.status IN ('to_do', 'working_on_it'))::int AS active_tasks,
        COUNT(t.id_tugas) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'done')::int AS overdue_tasks,
        MIN(t.due_date)::text AS earliest_due_date,
        BOOL_OR(
          t.timeline_start IS NOT NULL AND t.timeline_end IS NOT NULL
          AND t.timeline_start <= CURRENT_DATE AND t.timeline_end >= CURRENT_DATE
          AND t.status IN ('to_do', 'working_on_it')
        ) AS busy_today
       FROM tb_user u
       JOIN tb_tugas t ON t.assigned_to = u.id_user AND t.id_proyek = $1
       GROUP BY u.id_user, u.nama, u.email
       ORDER BY u.nama ASC`,
      [projectId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get project technicians error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function unassignTechnician(request: NextRequest, id: string, userId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;
  const roleCheck = authorizeRoles(auth.user, ['manajer']);
  if (roleCheck) return roleCheck;

  const projectId = parseInt(id);
  const userIdNum = parseInt(userId);
  if (isNaN(projectId) || isNaN(userIdNum)) {
    return NextResponse.json({ success: false, error: 'Invalid project or user ID' }, { status: 400 });
  }

  try {
    const result = await query(
      'DELETE FROM tb_penugasan_proyek WHERE id_proyek=$1 AND id_user=$2 RETURNING id_proyek',
      [projectId, userIdNum]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Technician unassigned successfully' });
  } catch (err) {
    console.error('Unassign technician error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
