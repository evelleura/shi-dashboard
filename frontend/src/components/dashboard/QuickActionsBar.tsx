'use client';

import Link from 'next/link';
import { useLanguage } from '../../hooks/useLanguage';

interface Props {
  onNewProject?: () => void;
  onNewClient?: () => void;
}

function PlusIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

export default function QuickActionsBar({ onNewProject, onNewClient }: Props) {
  const { language } = useLanguage();
  const id = language === 'id';

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={id ? 'Aksi cepat' : 'Quick actions'}>
      <button
        type="button"
        onClick={onNewProject}
        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={id ? 'Buat proyek baru' : 'Create new project'}
      >
        <PlusIcon />
        {id ? 'Proyek Baru' : 'New Project'}
      </button>

      <button
        type="button"
        onClick={onNewClient}
        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        aria-label={id ? 'Buat klien baru' : 'Create new client'}
      >
        <PlusIcon />
        {id ? 'Klien Baru' : 'New Client'}
      </button>

      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
        aria-label={id ? 'Lihat semua proyek' : 'View all projects'}
      >
        <FolderIcon />
        {id ? 'Lihat Semua Proyek' : 'View All Projects'}
      </Link>
    </div>
  );
}
