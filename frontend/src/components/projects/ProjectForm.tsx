import { useState, type FormEvent } from 'react';
import type { CreateProjectData, Client } from '../../types';

interface Props {
  clients: Client[];
  onSubmit: (data: CreateProjectData) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  initialData?: Partial<CreateProjectData>;
  submitLabel?: string;
}

export default function ProjectForm({ clients, onSubmit, onCancel, isPending, initialData, submitLabel = 'Buat Proyek' }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    client_id: initialData?.client_id ? String(initialData.client_id) : '',
    start_date: initialData?.start_date ?? '',
    end_date: initialData?.end_date ?? '',
    category: initialData?.category ?? 'instalasi',
    project_value: initialData?.project_value ? String(initialData.project_value) : '',
    target_description: initialData?.target_description ?? '',
  });

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Nama proyek wajib diisi.');
      return;
    }
    if (!form.start_date || !form.end_date) {
      setError('Tanggal mulai dan tanggal selesai wajib diisi.');
      return;
    }
    if (form.end_date <= form.start_date) {
      setError('Tanggal selesai harus setelah tanggal mulai.');
      return;
    }
    if (!form.client_id) {
      setError('Klien wajib dipilih.');
      return;
    }

    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        client_id: form.client_id ? parseInt(form.client_id) : undefined,
        start_date: form.start_date,
        end_date: form.end_date,
        category: form.category as CreateProjectData['category'],
        project_value: form.project_value ? parseFloat(form.project_value) : undefined,
        target_description: form.target_description.trim() || undefined,
      });
    } catch {
      setError('Gagal menyimpan proyek. Periksa kembali isian Anda lalu coba lagi.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="proj-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Proyek *</label>
        <input
          id="proj-name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="mis. Instalasi Smart Home IoT - Citra Raya"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="proj-client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Klien *</label>
        <select
          id="proj-client"
          name="client_id"
          value={form.client_id}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Pilih Klien --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="proj-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
        <select
          id="proj-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="instalasi">Instalasi</option>
          <option value="maintenance">Pemeliharaan</option>
          <option value="perbaikan">Perbaikan</option>
          <option value="upgrade">Peningkatan</option>
          <option value="monitoring">Pemantauan</option>
          <option value="security">Keamanan</option>
          <option value="networking">Jaringan</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <div>
        <label htmlFor="proj-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
        <textarea
          id="proj-desc"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Deskripsi singkat proyek..."
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="proj-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai *</label>
          <input
            id="proj-start"
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="proj-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Selesai *</label>
          <input
            id="proj-end"
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            required
            min={form.start_date}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="proj-value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nilai Proyek (Rp)</label>
        <input
          id="proj-value"
          type="number"
          name="project_value"
          value={form.project_value}
          onChange={handleChange}
          min={0}
          step={100000}
          placeholder="e.g. 50000000"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="proj-target" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi Target / Sasaran</label>
        <textarea
          id="proj-target"
          name="target_description"
          value={form.target_description}
          onChange={handleChange}
          rows={2}
          placeholder="Apa hasil yang ditargetkan untuk proyek ini?"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {isPending ? 'Menyimpan...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
