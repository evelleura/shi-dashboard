'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Language = 'id' | 'en';

const STORAGE_KEY = 'shi-language';
const DEFAULT_LANGUAGE: Language = 'id';

function getStoredLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'id' || v === 'en' ? v : null;
}

// External store so all consumers share the same state
let currentLanguage: Language = DEFAULT_LANGUAGE;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Language {
  return currentLanguage;
}

function setLanguageValue(lang: Language) {
  currentLanguage = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((cb) => cb());
}

// Initialize on first import (client only)
if (typeof window !== 'undefined') {
  const stored = getStoredLanguage();
  currentLanguage = stored ?? DEFAULT_LANGUAGE;
}

// Server-safe read for SSR contexts
export function getLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  return getStoredLanguage() ?? DEFAULT_LANGUAGE;
}

export function useLanguage() {
  const language = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_LANGUAGE,
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageValue(lang);
  }, []);

  const toggle = useCallback(() => {
    setLanguageValue(language === 'id' ? 'en' : 'id');
  }, [language]);

  return { language, setLanguage, toggle };
}
