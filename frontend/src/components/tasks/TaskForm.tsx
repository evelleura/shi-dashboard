import { useState, type FormEvent } from 'react';
import type { CreateTaskData, User } from '../../types';

interface Props {
  projectId: number;
  technicians: User[];
  onSubmit: (data: CreateTaskData) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
}

export default function TaskForm({ projectId, technicians, onSubmit, onCancel, isPending }: Props) {
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
  });

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Task name is required.');
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
      });
    } catch {
      setError('Failed to create task. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
        <input
          id="task-name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="e.g. Install CCTV Camera - Ruang Tamu"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="task-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          id="task-desc"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Brief task description..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          <select
            id="task-assignee"
            name="assigned_to"
            value={form.assigned_to}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-due" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            id="task-due"
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="task-budget" className="block text-sm font-medium text-gray-700 mb-1">Budget (Rp)</label>
        <input
          id="task-budget"
          type="number"
          name="budget"
          value={form.budget}
          onChange={handleChange}
          min={0}
          step={1000}
          placeholder="0"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="task-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          id="task-notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Additional notes..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-survey"
          name="is_survey_task"
          checked={form.is_survey_task}
          onChange={handleChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is-survey" className="text-sm text-gray-700">This is a survey task</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {isPending ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
