'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AIChatDrawer } from '@/components/layout/AIChatDrawer';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { useAppStore } from '@/store/useAppStore';
import { mockUser, mockNotifications } from '@/lib/mock-data';

export default function CHROLayout({ children }: { children: React.ReactNode }) {
  const { initTheme, setUser } = useAppStore();

  useEffect(() => {
    initTheme();
    setUser({ ...mockUser, role: 'chro', name: 'Vikram Singh', firstName: 'Vikram' });
    useAppStore.setState({ notifications: mockNotifications });
  }, [initTheme, setUser]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <Sidebar role="chro" />
      <NotificationPanel />
      <CommandPalette />
      <AIChatDrawer />
      <main id="main-content" className="pl-16 pt-14">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
