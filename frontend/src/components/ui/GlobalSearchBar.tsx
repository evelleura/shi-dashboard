import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '../../hooks/useDashboard';

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 shrink-0" aria-label="Searching..." />
  );
}

function ProjectIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ClientIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  project: <ProjectIcon />,
  task: <TaskIcon />,
  client: <ClientIcon />,
};

const TYPE_LABELS: Record<string, string> = {
  project: 'Projects',
  task: 'Tasks',
  client: 'Clients',
};

const TYPE_LABEL_COLORS: Record<string, string> = {
  project: 'text-blue-600 bg-blue-50',
  task: 'text-green-600 bg-green-50',
  client: 'text-purple-600 bg-purple-50',
};

export default function GlobalSearchBar() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce: 300ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: results, isFetching } = useGlobalSearch(debouncedQuery);

  // Open dropdown when there is a query and the input is focused
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [debouncedQuery]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setInputValue('');
    }
  }, []);

  function handleSelect(url: string) {
    setOpen(false);
    setInputValue('');
    setDebouncedQuery('');
    router.push(url);
  }

  // Group results by type preserving order: project, task, client
  const grouped: Record<string, typeof results> = {};
  if (results) {
    for (const item of results) {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type]!.push(item);
    }
  }
  const groupOrder = ['project', 'task', 'client'].filter((t) => grouped[t]?.length);
  const hasResults = groupOrder.length > 0;

  return (
    <div ref={containerRef} className="relative max-w-md w-full">
      {/* Search input */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <SearchIcon />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (debouncedQuery.length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, tasks, clients..."
          className="flex-1 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent outline-none"
          aria-label="Global search"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="global-search-dropdown"
          role="combobox"
          autoComplete="off"
        />
        {isFetching && <SpinnerIcon />}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id="global-search-dropdown"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {hasResults ? (
            <div className="py-1 max-h-80 overflow-y-auto">
              {groupOrder.map((type) => (
                <div key={type}>
                  {/* Group header */}
                  <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${TYPE_LABEL_COLORS[type]}`}>
                      {TYPE_LABELS[type]}
                    </span>
                  </div>
                  {/* Group items */}
                  {grouped[type]!.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleSelect(item.url)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
                    >
                      {TYPE_ICONS[item.type]}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                        {item.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : isFetching ? (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400 dark:text-gray-500">
              <SpinnerIcon />
              <span>Searching...</span>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
