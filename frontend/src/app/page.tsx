'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/views/LandingPage';
import { roleHome } from '@/lib/rbac';
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

export default function Page() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      router.replace(roleHome(user.role));
    } else {
      setShowLanding(true);
    }
  }, [router]);

  if (!showLanding) return null;

  return <LandingPage />;
}
