'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/views/LandingPage';
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
    if (user?.role === 'technician') {
      router.replace('/my-dashboard');
    } else if (user) {
      router.replace('/dashboard');
    } else {
      setShowLanding(true);
    }
  }, [router]);

  if (!showLanding) return null;

  return <LandingPage />;
}
