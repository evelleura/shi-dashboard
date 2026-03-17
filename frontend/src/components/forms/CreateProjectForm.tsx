import { useState, type FormEvent } from 'react';
import { useCreateProject } from '../../hooks/useDashboard';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateProjectForm({ onSuccess, onCancel }: Props) {
  const { mutateAsync: createProject, isPending, isError } = useCreateProject();

  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createProject({
      name: form.name,
      description: form.description || undefined,
      start_date: form.start_date,
      end_date: form.end_date,
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Failed to create project. Please check the dates.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="e.g. Smart Home IoT Installation - Citra Raya"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Brief project description..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            required
            min={form.start_date}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          {isPending ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
