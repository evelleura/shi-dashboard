import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkTechnicianConflicts } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';
import type { CreateTaskData, Task, User } from '../../types';

interface TechMeta {
  busy_today: boolean;
  active_tasks: number;
}

interface Props {
  projectId: number;
  technicians: User[];
  technicianMeta?: Record<number, TechMeta>;
  existingTasks?: Task[];
  onSubmit: (data: CreateTaskData) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  projectPhase?: string;
}

export default function TaskForm({ projectId, technicians, technicianMeta, existingTasks = [], onSubmit, onCancel, isPending, projectPhase }: Props) {
  const { language } = useLanguage();
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    assigned_to: '',
    due_date: '',
    timeline_start: '',
    timeline_end: '',
    notes: '',
    budget: '',
    is_survey_task: false,
    depends_on: '',
  });

  const [error, setError] = useState('');

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  // Conflict check: only when technician + both dates are set
  const canCheckConflicts = !!form.assigned_to && !!form.timeline_start && !!form.timeline_end;
  const { data: conflicts } = useQuery({
    queryKey: ['conflicts', form.assigned_to, form.timeline_start, form.timeline_end],
    queryFn: () => checkTechnicianConflicts({
      technician_id: parseInt(form.assigned_to),
      start: form.timeline_start,
      end: form.timeline_end,
    }),
    enabled: canCheckConflicts,
    staleTime: 1000 * 15,
  });

  // Reset conflict when inputs change
  useEffect(() => {
    if (!canCheckConflicts) return;
  }, [form.assigned_to, form.timeline_start, form.timeline_end, canCheckConflicts]);

  // Close assignee dropdown on outside click
  useEffect(() => {
    if (!assigneeOpen) return;
    const handler = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [assigneeOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError(t('task.name_required', language));
      return;
    }

    try {
      await onSubmit({
        project_id: projectId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        assigned_to: form.assigned_to ? parseInt(form.assigned_to) : undefined,
        due_date: form.due_date || undefined,
        timeline_start: form.timeline_start || undefined,
        timeline_end: form.timeline_end || undefined,
        notes: form.notes.trim() || undefined,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        is_survey_task: form.is_survey_task,
        depends_on: form.depends_on ? parseInt(form.depends_on) : null,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('task.create_error', language));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm" role="alert">
          {error}
        </div>
      )}

      {conflicts && conflicts.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm" role="alert">
          <p className="font-medium mb-1">{language === 'id' ? 'Peringatan: Teknisi sudah memiliki tugas di rentang waktu ini:' : 'Warning: Technician already has tasks in this time range:'}</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {conflicts.map((c) => (
              <li key={c.id}>{c.name} ({c.project_name})</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.name', language)} *</label>
        <input id="task-name" type="text" name="name" value={form.name} onChange={handleChange} required placeholder={t('task.name_placeholder', language)} className={inputClass} />
      </div>

      <div>
        <label htmlFor="task-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.description', language)}</label>
        <textarea id="task-desc" name="description" value={form.description} onChange={handleChange} rows={2} placeholder={t('task.description_placeholder', language)} className={`${inputClass} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.assignee', language)}</label>
          {technicianMeta ? (
            <div ref={assigneeRef} className="relative">
              <button
                type="button"
                onClick={() => setAssigneeOpen((o) => !o)}
                className={`${inputClass} flex items-center justify-between text-left`}
              >
                <span>
                  {form.assigned_to
                    ? (() => {
                        const tech = technicians.find((t) => String(t.id) === form.assigned_to);
                        const meta = tech ? technicianMeta[tech.id] : undefined;
                        return tech ? (
                          <span className="flex items-center gap-2">
                            {tech.name}
                            {meta && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.busy_today ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                {meta.busy_today ? 'Sibuk' : 'Bebas'}
                              </span>
                            )}
                          </span>
                        ) : t('task.unassigned', language);
                      })()
                    : t('task.unassigned', language)}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {assigneeOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setForm((f) => ({ ...f, assigned_to: '' })); setAssigneeOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t('task.unassigned', language)}
                  </button>
                  {technicians.map((tech) => {
                    const meta = technicianMeta[tech.id];
                    return (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, assigned_to: String(tech.id) })); setAssigneeOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100">{tech.name}</span>
                        {meta && (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.busy_today ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {meta.busy_today ? 'Sibuk' : 'Bebas'}
                            </span>
                            {meta.active_tasks > 0 && (
                              <span className="text-xs text-gray-400">{meta.active_tasks} aktif</span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <select id="task-assignee" name="assigned_to" value={form.assigned_to} onChange={handleChange} className={inputClass}>
              <option value="">{t('task.unassigned', language)}</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="task-due" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.due_date', language)}</label>
          <input id="task-due" type="date" name="due_date" value={form.due_date} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-tl-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.timeline_start', language)}</label>
          <input id="task-tl-start" type="date" name="timeline_start" value={form.timeline_start} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="task-tl-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.timeline_end', language)}</label>
          <input id="task-tl-end" type="date" name="timeline_end" value={form.timeline_end} onChange={handleChange} min={form.timeline_start} className={inputClass} />
        </div>
      </div>

      {existingTasks.length > 0 && (
        <div>
          <label htmlFor="task-depends-on" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('task.depends_on', language)}
            <span className="text-xs text-gray-400 ml-1">{t('task.depends_on_hint', language)}</span>
          </label>
          <select id="task-depends-on" name="depends_on" value={form.depends_on} onChange={handleChange} className={inputClass}>
            <option value="">{t('task.no_prerequisite', language)}</option>
            {existingTasks.map((et) => (
              <option key={et.id} value={et.id}>{et.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="task-budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('task.budget', language)}</label>
        <input id="task-budget" type="number" name="budget" value={form.budget} onChange={handleChange} min={0} step={1000} placeholder="0" className={inputClass} />
      </div>

      <div>
        <label htmlFor="task-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.notes', language)}</label>
        <textarea id="task-notes" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder={t('task.notes_placeholder', language)} className={`${inputClass} resize-none`} />
      </div>

      {projectPhase === 'survey' && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is-survey" name="is_survey_task" checked={form.is_survey_task} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="is-survey" className="text-sm text-gray-700 dark:text-gray-300">{t('task.survey_task', language)}</label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          {t('action.cancel', language)}
        </button>
        <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
          {isPending ? t('action.saving', language) : t('task.create_button', language)}
        </button>
      </div>
    </form>
  );
}
