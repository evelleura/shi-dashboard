import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import TaskStatusSelect from './TaskStatusSelect';
import EvidenceUploader from '../evidence/EvidenceUploader';
import EvidenceGallery from '../evidence/EvidenceGallery';
import ActivityFeed from './ActivityFeed';
import TaskTimer from './TaskTimer';
import { useStartTimer, useStopTimer } from '../../hooks/useActivities';
import { useCreateEscalation } from '../../hooks/useEscalations';
import { useUpdateTask } from '../../hooks/useTasks';
import { useTechnicians } from '../../hooks/useDashboard';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';
import type { Task, TaskStatus, UserRole, EscalationPriority, User, UpdateTaskData } from '../../types';

type Section = 'details' | 'evidence' | 'activity';

interface EditForm {
  name: string;
  description: string;
  assigned_to: string;
  due_date: string;
  timeline_start: string;
  timeline_end: string;
  notes: string;
  depends_on: string;
  budget: string;
}

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  isChanging?: boolean;
  userRole?: UserRole;
  existingTasks?: Task[];
  technicians?: User[];
  projectId?: number;
}

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function formatDate(dateStr: string, lang: 'id' | 'en' = 'id'): string {
  return new Date(dateStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function toDateInputValue(dateStr?: string): string {
  if (!dateStr) return '';
  // Accept ISO strings or YYYY-MM-DD
  return dateStr.slice(0, 10);
}

export default function TaskDetailModal({
  task,
  open,
  onClose,
  onStatusChange,
  isChanging,
  userRole,
  existingTasks,
  technicians: techniciansProp,
  projectId,
}: Props) {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>('details');

  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();
  const createEscalationMutation = useCreateEscalation();
  const updateTaskMutation = useUpdateTask();

  // Technicians: prefer prop, fallback to internal fetch
  const { data: techniciansFromHook = [] } = useTechnicians();
  const technicians = techniciansProp ?? techniciansFromHook;

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    description: '',
    assigned_to: '',
    due_date: '',
    timeline_start: '',
    timeline_end: '',
    notes: '',
    depends_on: '',
    budget: '',
  });
  const [editError, setEditError] = useState('');

  // Reset edit state when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditError('');
    }
  }, [open]);

  // Escalation state
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [escTitle, setEscTitle] = useState('');
  const [escDescription, setEscDescription] = useState('');
  const [escPriority, setEscPriority] = useState<EscalationPriority>('medium');
  const [escFile, setEscFile] = useState<File | null>(null);
  const escFileRef = useRef<HTMLInputElement>(null);

  const resetEscalationForm = () => {
    setEscTitle('');
    setEscDescription('');
    setEscPriority('medium');
    setEscFile(null);
    if (escFileRef.current) escFileRef.current.value = '';
    setShowEscalationForm(false);
  };

  const handleEscalationSubmit = () => {
    if (!task || !escTitle.trim() || !escDescription.trim()) return;
    const formData = new FormData();
    formData.append('task_id', String(task.id));
    formData.append('title', escTitle.trim());
    formData.append('description', escDescription.trim());
    formData.append('priority', escPriority);
    if (escFile) formData.append('file', escFile);
    createEscalationMutation.mutate(formData, {
      onSuccess: () => resetEscalationForm(),
    });
  };

  if (!task) return null;

  const isTechnician = userRole === 'technician';
  const canEdit = userRole === 'manager' || userRole === 'admin';
  const isOverdue = task.due_date && task.status !== 'done' && task.status !== 'review' && new Date(task.due_date) < new Date();
  const isOvertime = isOverdue && (task.status === 'working_on_it' || task.status === 'in_progress');
  const isOverDeadline = isOverdue && task.status === 'to_do';

  const evidenceCount = task.evidence_count ?? 0;
  const activityCount = task.activity_count ?? 0;

  const handleUploadComplete = () => {
    void qc.invalidateQueries({ queryKey: ['task', task.id] });
    void qc.invalidateQueries({ queryKey: ['technician-dashboard'] });
  };

  const handleStartTimer = () => {
    startTimerMutation.mutate({ taskId: task.id, projectId: task.project_id });
  };

  const handleStopTimer = () => {
    stopTimerMutation.mutate({ taskId: task.id, projectId: task.project_id });
  };

  const handleEditStart = () => {
    setEditForm({
      name: task.name,
      description: task.description ?? '',
      assigned_to: task.assigned_to != null ? String(task.assigned_to) : '',
      due_date: toDateInputValue(task.due_date),
      timeline_start: toDateInputValue(task.timeline_start),
      timeline_end: toDateInputValue(task.timeline_end),
      notes: task.notes ?? '',
      depends_on: task.depends_on != null ? String(task.depends_on) : '',
      budget: task.budget != null && Number(task.budget) > 0 ? String(task.budget) : '',
    });
    setEditError('');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleEditSave = () => {
    if (!editForm.name.trim()) {
      setEditError(t('task.name_required', language));
      return;
    }

    const data: UpdateTaskData = {
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      assigned_to: editForm.assigned_to === '' ? null : parseInt(editForm.assigned_to, 10),
      due_date: editForm.due_date || undefined,
      timeline_start: editForm.timeline_start || undefined,
      timeline_end: editForm.timeline_end || undefined,
      notes: editForm.notes.trim() || undefined,
      depends_on: editForm.depends_on === '' ? null : parseInt(editForm.depends_on, 10),
      budget: editForm.budget === '' ? undefined : parseFloat(editForm.budget),
    };

    const pid = projectId ?? task.project_id;

    updateTaskMutation.mutate(
      { id: task.id, data, projectId: pid },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditError('');
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : t('task.save_error', language);
          setEditError(msg);
        },
      }
    );
  };

  const otherTasks = (existingTasks ?? []).filter((t) => t.id !== task.id);

  const tabs: { id: Section; label: string; badge?: number }[] = [
    { id: 'details', label: language === 'id' ? 'Detail' : 'Details' },
    { id: 'evidence', label: language === 'id' ? 'Bukti' : 'Evidence', badge: evidenceCount },
    { id: 'activity', label: language === 'id' ? 'Aktivitas' : 'Activity', badge: activityCount },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('task.detail_title', language)} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Title + badges row */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.name}</h3>
            {canEdit && !isEditing && (
              <button
                onClick={handleEditStart}
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 px-2.5 py-1.5 rounded-lg transition-colors"
                aria-label={t('action.edit', language)}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.5-6.5a2 2 0 112.828 2.828L11.828 13.828a4 4 0 01-1.414.94l-3 1 1-3a4 4 0 01.94-1.414z" />
                </svg>
                {t('action.edit', language)}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TaskStatusSelect
              value={task.status}
              onChange={(s) => onStatusChange(task.id, s)}
              disabled={isChanging || isEditing}
              size="md"
              userRole={userRole}
            />
            {task.is_survey_task && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">{t('project.phase_survey', language)}</span>
            )}
            {isOvertime && (
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">{t('tech.overtime', language)}</span>
            )}
            {isOverDeadline && (
              <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium">{t('tech.over_deadline', language)}</span>
            )}
            {/* Submit for Review -- technician only */}
            {isTechnician && (task.status === 'in_progress' || task.status === 'working_on_it') && (
              <button
                onClick={() => onStatusChange(task.id, 'review')}
                disabled={isChanging}
                className="text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                aria-label="Submit task for review"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Submit for Review
              </button>
            )}
            {/* Escalate button -- technician only, task not done */}
            {isTechnician && task.status !== 'done' && (
              <button
                onClick={() => setShowEscalationForm(true)}
                className="ml-auto text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                aria-label="Escalate this task"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Escalate
              </button>
            )}
          </div>
        </div>

        {/* ===== EDIT FORM ===== */}
        {isEditing && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('task.edit_title', language)}</h4>

            {/* Nama Tugas */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('task.name', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.description', language)}</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className={inputClass + ' resize-none'}
              />
            </div>

            {/* Penugasan */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.assignee', language)}</label>
              <select
                value={editForm.assigned_to}
                onChange={(e) => setEditForm((f) => ({ ...f, assigned_to: e.target.value }))}
                className={inputClass}
              >
                <option value="">{t('task.unassigned', language)}</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenggat Waktu */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.due_date', language)}</label>
              <input
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Mulai Jadwal / Selesai Jadwal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.timeline_start', language)}</label>
                <input
                  type="date"
                  value={editForm.timeline_start}
                  onChange={(e) => setEditForm((f) => ({ ...f, timeline_start: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.timeline_end', language)}</label>
                <input
                  type="date"
                  value={editForm.timeline_end}
                  onChange={(e) => setEditForm((f) => ({ ...f, timeline_end: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.notes', language)}</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className={inputClass + ' resize-none'}
              />
            </div>

            {/* Bergantung Pada */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.depends_on', language)}</label>
              <select
                value={editForm.depends_on}
                onChange={(e) => setEditForm((f) => ({ ...f, depends_on: e.target.value }))}
                className={inputClass}
              >
                <option value="">{t('task.no_prerequisite', language)}</option>
                {otherTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Anggaran -- manager/admin only */}
            {canEdit && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.budget_label', language)}</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editForm.budget}
                  onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            )}

            {/* Error */}
            {editError && (
              <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>
            )}

            {/* Save / Cancel */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleEditCancel}
                disabled={updateTaskMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {t('action.cancel', language)}
              </button>
              <button
                onClick={handleEditSave}
                disabled={updateTaskMutation.isPending || !editForm.name.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateTaskMutation.isPending ? t('action.saving', language) : t('action.save', language)}
              </button>
            </div>
          </div>
        )}

        {/* ===== READ-ONLY DISPLAY (when not editing) ===== */}
        {!isEditing && (
          <>
            {/* Escalation Form (inline) */}
            {showEscalationForm && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3" role="form" aria-label="Escalation form">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">Laporkan Masalah</h4>
                  <button onClick={resetEscalationForm} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs" aria-label="Batal eskalasi">Batal</button>
                </div>
                <div>
                  <label htmlFor="esc-title" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Judul <span className="text-red-500">*</span></label>
                  <input
                    id="esc-title"
                    type="text"
                    value={escTitle}
                    onChange={(e) => setEscTitle(e.target.value)}
                    placeholder="Ringkasan singkat masalah"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="esc-desc" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi <span className="text-red-500">*</span></label>
                  <textarea
                    id="esc-desc"
                    value={escDescription}
                    onChange={(e) => setEscDescription(e.target.value)}
                    placeholder="Jelaskan masalah secara rinci..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="esc-priority" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prioritas</label>
                    <select
                      id="esc-priority"
                      value={escPriority}
                      onChange={(e) => setEscPriority(e.target.value as EscalationPriority)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="low">Rendah</option>
                      <option value="medium">Sedang</option>
                      <option value="high">Tinggi</option>
                      <option value="critical">Kritis</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="esc-file" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lampiran (opsional)</label>
                    <input
                      id="esc-file"
                      ref={escFileRef}
                      type="file"
                      onChange={(e) => setEscFile(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={resetEscalationForm}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleEscalationSubmit}
                    disabled={!escTitle.trim() || !escDescription.trim() || createEscalationMutation.isPending}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createEscalationMutation.isPending ? 'Mengirim...' : 'Kirim Eskalasi'}
                  </button>
                </div>
                {createEscalationMutation.isError && (
                  <p className="text-xs text-red-600">Gagal mengirim eskalasi. Silakan coba lagi.</p>
                )}
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('task.description', language)}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{task.description}</p>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('label.assignee', language)}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.assigned_to_name ?? t('task.unassigned', language)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Proyek</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.project_name ?? '--'}</p>
              </div>
              <div className={`rounded-lg p-3 ${isOverdue ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('label.due_date', language)}</p>
                <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {task.due_date ? formatDate(task.due_date, language) : t('task.no_due_date', language)}
                  {isOverdue && ` (${t('task.overdue', language).toLowerCase()})`}
                </p>
              </div>
              {!isTechnician && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('task.budget_label', language)}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Number(task.budget) > 0 ? formatCurrency(Number(task.budget)) : '--'}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {task.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('label.notes', language)}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">{task.notes}</p>
              </div>
            )}
          </>
        )}

        {/* Section tabs -- always visible */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto" role="tablist" aria-label="Tab detail tugas">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeSection === tab.id}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveSection(tab.id)}
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Details tab */}
          {activeSection === 'details' && (
            <div className="pt-3 space-y-3">
              {(task.timeline_start || task.timeline_end) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('schedule.gantt', language)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {task.timeline_start ? formatDate(task.timeline_start, language) : '?'} -- {task.timeline_end ? formatDate(task.timeline_end, language) : '?'}
                  </p>
                </div>
              )}
              {task.depends_on_name && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('task.depends_on', language)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{task.depends_on_name}</p>
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                {task.created_at && <p>{t('label.created_at', language)}: {formatDate(task.created_at, language)}</p>}
                {task.updated_at && <p>{t('label.updated_at', language)}: {formatDate(task.updated_at, language)}</p>}
              </div>
            </div>
          )}

          {/* Evidence tab */}
          {activeSection === 'evidence' && (
            <div className="pt-3 space-y-4">
              <EvidenceUploader taskId={task.id} onUploadComplete={handleUploadComplete} />
              <EvidenceGallery taskId={task.id} />
            </div>
          )}

          {/* Activity tab */}
          {activeSection === 'activity' && (
            <div className="pt-3 space-y-4">
              {/* Timer at top */}
              <TaskTimer
                task={task}
                onStart={handleStartTimer}
                onStop={handleStopTimer}
                isLoading={startTimerMutation.isPending || stopTimerMutation.isPending}
              />

              {/* Activity feed */}
              <ActivityFeed taskId={task.id} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
