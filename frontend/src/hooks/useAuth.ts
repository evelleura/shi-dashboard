import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { login as apiLogin, register as apiRegister } from '../services/api';
import type { User } from '../types';

export function useAuth() {
  // Cache TanStack Query di-share satu instance utk seluruh sesi SPA. Tanpa di-clear
  // saat ganti pengguna, query tanpa-id-pengguna (mis. ['technician-dashboard'], staleTime
  // 60s) bisa menyajikan data milik pengguna SEBELUMNYA -> mis. teknisi B lihat SPI teknisi A.
  // Clear di setiap login/logout -> tiap sesi mulai bersih, fetch ulang dgn token baru.
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  });

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    queryClient.clear();   // buang cache pengguna sebelumnya
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, [queryClient]);

  const register = useCallback(async (name: string, email: string, password: string, role: string) => {
    const data = await apiRegister(name, email, password, role);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    queryClient.clear();
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();   // jangan tinggalkan data sesi lama di cache
    setToken(null);
    setUser(null);
  }, [queryClient]);

  return { user, token, isAuthenticated: !!token, login, register, logout };
}
