'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'shi-theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : null;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// External store so all consumers share the same state
let currentTheme: Theme = 'light';
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return currentTheme;
}

function setThemeValue(t: Theme) {
  currentTheme = t;
  applyTheme(t);
  localStorage.setItem(STORAGE_KEY, t);
  listeners.forEach((cb) => cb());
}

// Initialize on first import (client only)
if (typeof window !== 'undefined') {
  const stored = getStoredTheme();
  currentTheme = stored ?? getSystemTheme();
  // Apply immediately to avoid flash
  applyTheme(currentTheme);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'light' as Theme);

  const toggle = useCallback(() => {
    setThemeValue(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeValue(t);
  }, []);

  return { theme, toggle, setTheme, isDark: theme === 'dark' };
}
