'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/ui/Layout';
import type { UserRole } from '@/types';

function getStoredUser(): { role: UserRole } | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = getStoredUser();

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    setAuthorized(true);
    setChecked(true);
  }, [router]);

  if (!checked || !authorized) {
    return null;
  }

  return <Layout>{children}</Layout>;
}
