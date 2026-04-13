import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateSPI } from '@/lib/spiCalculator';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const VALID_ACTIVITY_TYPES = ['arrival', 'start_work', 'pause', 'resume', 'note', 'photo', 'complete'];

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

export async function createActivity(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const task_id = formData.get('task_id') as string;
  const message = formData.get('message') as string;
  const activity_type = formData.get('activity_type') as string | null;

  if (!task_id) return NextResponse.json({ success: false, error: 'task_id is required' }, { status: 400 });
  if (!message || message.trim().length === 0) return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
  if (file) {
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel' }, { status: 400 });
    }
  }

  const finalType = activity_type && VALID_ACTIVITY_TYPES.includes(activity_type) ? activity_type : 'note';
  let savedFilePath: string | null = null;

  try {
    const taskCheck = await query<{ id: number; project_id: number; assigned_to: number }>(
      'SELECT id, project_id, assigned_to FROM tasks WHERE id = $1', [task_id]
    );
    if (taskCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    const task = taskCheck.rows[0];

    if (auth.user.role === 'technician' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'You can only add activities to tasks assigned to you' }, { status: 403 });
    }

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize = 0;

    if (file) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'projects', String(task.project_id), 'tasks', String(task_id), 'activities');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = sanitizeFilename(file.name);
      savedFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(savedFilePath, Buffer.from(await file.arrayBuffer()));
      filePath = path.join('uploads', 'projects', String(task.project_id), 'tasks', String(task_id), 'activities', filename).replace(/\\/g, '/');
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
    }

    const result = await query(
      `INSERT INTO task_activities (task_id, user_id, message, activity_type, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [task_id, auth.user.userId, message.trim(), finalType, filePath, fileName, fileType, fileSize]
    );
    const activity = result.rows[0] as Record<string, unknown>;
    const userResult = await query<{ name: string }>('SELECT name FROM users WHERE id = $1', [auth.user.userId]);
    return NextResponse.json({ success: true, data: { ...activity, user_name: userResult.rows[0]?.name || null } }, { status: 201 });
  } catch (err) {
    if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
    console.error('Create activity error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getMyTodayActivities(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  try {
    const result = await query(
      `SELECT a.*, t.name AS task_name, p.name AS project_name
       FROM task_activities a JOIN tasks t ON t.id = a.task_id JOIN projects p ON p.id = t.project_id
       WHERE a.user_id = $1 AND a.created_at >= CURRENT_DATE ORDER BY a.created_at ASC`,
      [auth.user.userId]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get my today activities error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function getActivitiesByTask(request: NextRequest, taskId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(taskId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });

  try {
    if (auth.user.role === 'technician') {
      const taskCheck = await query<{ assigned_to: number }>('SELECT assigned_to FROM tasks WHERE id = $1', [id]);
      if (taskCheck.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      if (taskCheck.rows[0].assigned_to !== auth.user.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }
    }
    const result = await query(
      `SELECT a.*, u.name AS user_name FROM task_activities a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.task_id = $1 ORDER BY a.created_at ASC`,
      [id]
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get activities error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function startTimer(request: NextRequest, taskId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(taskId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });

  try {
    const taskResult = await query<{ id: number; project_id: number; assigned_to: number; status: string; is_tracking: boolean; time_spent_seconds: number }>(
      'SELECT id, project_id, assigned_to, status, is_tracking, time_spent_seconds FROM tasks WHERE id = $1', [id]
    );
    if (taskResult.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    const task = taskResult.rows[0];

    if (auth.user.role === 'technician' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'You can only start timer on tasks assigned to you' }, { status: 403 });
    }
    if (task.status === 'review' || task.status === 'done') {
      return NextResponse.json({ success: false, error: 'Cannot start timer on reviewed/done task' }, { status: 400 });
    }
    if (task.is_tracking) {
      return NextResponse.json({ success: false, error: 'Timer is already running on this task' }, { status: 409 });
    }

    // Stop any currently running timers for this user
    const currentlyTracking = await query<{ id: number; project_id: number }>(
      'SELECT id, project_id FROM tasks WHERE assigned_to = $1 AND is_tracking = true AND id != $2',
      [auth.user.userId, id]
    );
    for (const running of currentlyTracking.rows) {
      await query(
        `UPDATE tasks SET is_tracking=false, time_spent_seconds=time_spent_seconds+EXTRACT(EPOCH FROM (NOW()-timer_started_at))::int,
          timer_started_at=NULL, status='in_progress', updated_at=NOW() WHERE id=$1`,
        [running.id]
      );
      const stoppedTask = await query<{ time_spent_seconds: number }>('SELECT time_spent_seconds FROM tasks WHERE id = $1', [running.id]);
      const stoppedMins = Math.round((stoppedTask.rows[0]?.time_spent_seconds ?? 0) / 60);
      await query(
        `INSERT INTO task_activities (task_id, user_id, message, activity_type) VALUES ($1, $2, $3, 'pause')`,
        [running.id, auth.user.userId, `Auto-paused (switched task, ${stoppedMins} min total)`]
      );
    }

    const activityType = task.time_spent_seconds > 0 ? 'resume' : 'start_work';
    const activityMessage = task.time_spent_seconds > 0 ? 'Resumed working' : 'Started working';
    const newStatus = (task.status === 'to_do' || task.status === 'in_progress') ? 'working_on_it' : task.status;

    const updateResult = await query(
      'UPDATE tasks SET is_tracking=true, timer_started_at=NOW(), status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [newStatus, id]
    );
    await query(
      'INSERT INTO task_activities (task_id, user_id, message, activity_type) VALUES ($1, $2, $3, $4)',
      [id, auth.user.userId, activityMessage, activityType]
    );
    if (task.status !== newStatus) await recalculateSPI(task.project_id);
    return NextResponse.json({ success: true, data: updateResult.rows[0] });
  } catch (err) {
    console.error('Start timer error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function stopTimer(request: NextRequest, taskId: string) {
  const auth = authenticateRequest(request);
  if (!auth.user) return auth.errorResponse;

  const id = parseInt(taskId);
  if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 });

  try {
    const taskResult = await query<{ id: number; project_id: number; assigned_to: number; is_tracking: boolean }>(
      'SELECT id, project_id, assigned_to, is_tracking, timer_started_at FROM tasks WHERE id = $1', [id]
    );
    if (taskResult.rowCount === 0) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    const task = taskResult.rows[0];

    if (auth.user.role === 'technician' && task.assigned_to !== auth.user.userId) {
      return NextResponse.json({ success: false, error: 'You can only stop timer on tasks assigned to you' }, { status: 403 });
    }
    if (!task.is_tracking) {
      return NextResponse.json({ success: false, error: 'Timer is not running on this task' }, { status: 409 });
    }

    const updateResult = await query(
      `UPDATE tasks SET is_tracking=false, time_spent_seconds=time_spent_seconds+EXTRACT(EPOCH FROM (NOW()-timer_started_at))::int,
        timer_started_at=NULL, status='in_progress', updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id]
    );
    const updatedTask = updateResult.rows[0] as Record<string, unknown>;
    const minutes = Math.round((updatedTask.time_spent_seconds as number) / 60);
    await query(
      'INSERT INTO task_activities (task_id, user_id, message, activity_type) VALUES ($1, $2, $3, $4)',
      [id, auth.user.userId, `Paused work (${minutes} min total)`, 'pause']
    );
    return NextResponse.json({ success: true, data: updatedTask });
  } catch (err) {
    console.error('Stop timer error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
