'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

const STORAGE_KEY = 'shi-theme';

function systemTheme(): Resolved {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  // Default 'system' (ikut OS). Nilai lama 'light'/'dark' tetap valid (override eksplisit).
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function resolve(m: ThemeMode): Resolved {
  return m === 'system' ? systemTheme() : m;
}

function apply(r: Resolved) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', r === 'dark');
}

// External store -> semua consumer berbagi state yang sama (mode + resolusi).
let mode: ThemeMode = 'system';
let resolved: Resolved = 'light';
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function setMode(next: ThemeMode) {
  mode = next;
  resolved = resolve(next);
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
  apply(resolved);
  notify();
}

// Inisialisasi sisi-klien: baca mode tersimpan + IKUTI perubahan tema OS saat
// mode 'system' (live, tanpa reload). FOUC dicegah oleh skrip inline di layout.tsx.
if (typeof window !== 'undefined') {
  mode = readMode();
  resolved = resolve(mode);
  apply(resolved);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (mode === 'system') {
      resolved = systemTheme();
      apply(resolved);
      notify();
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
// Snapshot = primitif stabil "mode:resolved" -> berubah saat mode ATAU resolusi berubah.
function getSnapshot() {
  return `${mode}:${resolved}`;
}
function getServerSnapshot() {
  return 'system:light';
}

export function useTheme() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [m, r] = snap.split(':') as [ThemeMode, Resolved];

  const setTheme = useCallback((next: ThemeMode) => setMode(next), []);
  // Toggle cepat (tombol navbar) -> set override eksplisit light/dark dari tema aktif.
  const toggle = useCallback(() => setMode(r === 'dark' ? 'light' : 'dark'), [r]);

  return { theme: m, resolvedTheme: r, isDark: r === 'dark', setTheme, toggle };
}
