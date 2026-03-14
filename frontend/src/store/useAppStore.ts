import { create } from 'zustand';
import type { User, Notification } from '@/types/user';

interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  initTheme: () => void;

  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // AI Drawer
  isAIDrawerOpen: boolean;
  openAIDrawer: () => void;
  closeAIDrawer: () => void;
  toggleAIDrawer: () => void;

  // Notification Panel
  isNotificationOpen: boolean;
  notifications: Notification[];
  toggleNotifications: () => void;
  closeNotifications: () => void;
  markAllAsRead: () => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Sidebar
  isSidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
}

function getResolvedTheme(theme: string): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme as 'light' | 'dark';
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    const resolved = getResolvedTheme(theme);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    set({ theme, resolvedTheme: resolved });
  },
  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  initTheme: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const theme = stored || 'system';
    const resolved = getResolvedTheme(theme);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    set({ theme, resolvedTheme: resolved });
  },

  // User
  user: null,
  setUser: (user) => set({ user }),

  // AI Drawer
  isAIDrawerOpen: false,
  openAIDrawer: () => set({ isAIDrawerOpen: true }),
  closeAIDrawer: () => set({ isAIDrawerOpen: false }),
  toggleAIDrawer: () => set((s) => ({ isAIDrawerOpen: !s.isAIDrawerOpen })),

  // Notifications
  isNotificationOpen: false,
  notifications: [],
  toggleNotifications: () => set((s) => ({ isNotificationOpen: !s.isNotificationOpen })),
  closeNotifications: () => set({ isNotificationOpen: false }),
  markAllAsRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
  })),

  // Command Palette
  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

  // Sidebar
  isSidebarExpanded: false,
  setSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
}));
