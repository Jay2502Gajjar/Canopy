'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { mockUser, mockNotifications } from '@/lib/mock-data';

export default function Home() {
  const router = useRouter();
  const { setUser, initTheme } = useAppStore();

  useEffect(() => {
    initTheme();
    router.replace('/auth/login');
  }, [router, initTheme]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-lg font-heading">C</span>
        </div>
        <p className="text-sm text-text-muted">Loading Canopy...</p>
      </div>
    </div>
  );
}
