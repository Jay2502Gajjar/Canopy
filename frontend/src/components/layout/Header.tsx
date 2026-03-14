'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Sun, Moon, Search, Command, User, LogOut, ChevronDown, X, Monitor } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { mockEmployees } from '@/lib/mock-data';

export function Header({ pageTitle }: { pageTitle?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMac, setIsMac] = useState(true);
  const {
    resolvedTheme, toggleTheme,
    toggleNotifications, isNotificationOpen, notifications,
    openCommandPalette, user
  } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const role = pathname?.startsWith('/chro') ? 'chro' : pathname?.startsWith('/hrbp') ? 'hrbp' : 'hro';

  // Detect OS for shortcut (#8)
  useEffect(() => {
    setIsMac(typeof window !== 'undefined' ? navigator.platform.toUpperCase().indexOf('MAC') >= 0 : true);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchOpen(false); setSearchQuery(''); }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Search results (#9)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return mockEmployees.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const handleEmployeeClick = (empId: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/${role}/employees/${empId}`);
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 h-14',
      'bg-surface-card/80 backdrop-blur-xl border-b border-border',
      'flex items-center justify-between px-4 gap-4'
    )}>
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Image src="/canopy-logo.png" alt="Canopy Logo" width={32} height={32} className="flex-shrink-0 drop-shadow-sm" />
        <span className="text-xl font-bold font-heading hidden sm:block bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent tracking-tight">
          Canopy
        </span>
        {pageTitle && (
          <>
            <span className="text-border hidden md:block">/</span>
            <span className="text-sm font-medium text-text-muted hidden md:block truncate">{pageTitle}</span>
          </>
        )}
      </div>

      {/* Center: Search with live results (#9) */}
      <div ref={searchRef} className="relative hidden md:block max-w-md flex-1">
        <div className={cn(
          'flex items-center gap-2 px-4 h-9 rounded-lg',
          'bg-surface border border-border',
          'text-text-muted text-sm',
          searchOpen ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/40',
          'transition-all'
        )} onClick={() => setSearchOpen(true)}>
          <Search size={15} />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search employees, modules..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-muted"
          />
          {searchQuery ? (
            <button onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }} className="hover:text-foreground"><X size={14} /></button>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 opacity-60">
              <kbd className="flex items-center gap-0.5 text-[10px] bg-surface-card border border-border rounded px-1.5 py-0.5 font-sans font-medium hover:opacity-100 transition-opacity" title="Mac Shortcut">
                <Command size={10} />K
              </kbd>
              <span className="text-[10px] text-border">/</span>
              <kbd className="flex items-center gap-0.5 text-[10px] bg-surface-card border border-border rounded px-1.5 py-0.5 font-sans font-medium hover:opacity-100 transition-opacity" title="Windows Shortcut">
                <Monitor size={10} /> Ctrl+K
              </kbd>
            </div>
          )}
        </div>
        {/* Search Results Dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[360px] overflow-y-auto">
            <div className="px-3 py-2 text-[10px] text-text-muted uppercase tracking-wide">Employees ({searchResults.length})</div>
            {searchResults.map((emp) => (
              <button key={emp.id} onClick={() => handleEmployeeClick(emp.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {getInitials(emp.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-text-muted">{emp.role} · {emp.department}</p>
                </div>
                <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                  emp.riskTier === 'critical' ? 'bg-danger/10 text-danger' :
                  emp.riskTier === 'concern' ? 'bg-warning/10 text-warning' :
                  emp.riskTier === 'watch' ? 'bg-secondary/10 text-secondary' : 'bg-success/10 text-success'
                )}>{emp.riskTier}</span>
              </button>
            ))}
          </div>
        )}
        {searchOpen && searchQuery && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-border rounded-xl shadow-xl z-50 px-4 py-6 text-center text-sm text-text-muted">
            No employees found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button onClick={toggleNotifications}
          className={cn('relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface transition-colors', isNotificationOpen && 'bg-surface')}
          aria-label="Notifications">
          <Bell size={18} className="text-text-muted" />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />}
        </button>

        <button onClick={toggleTheme} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface transition-colors" aria-label="Toggle theme">
          {resolvedTheme === 'dark' ? <Sun size={18} className="text-text-muted" /> : <Moon size={18} className="text-text-muted" />}
        </button>

        {/* Profile Avatar Dropdown (#8) — improved with image/initials and role badge */}
        <div ref={profileRef} className="relative ml-1">
          <button onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-surface transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user ? getInitials(user.name) : '??'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight">{user?.name || 'Loading...'}</p>
              <p className="text-[10px] text-text-muted leading-tight">{role.toUpperCase()}</p>
            </div>
            <ChevronDown size={12} className={cn('text-text-muted transition-transform', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-surface-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center text-sm font-bold">
                  {user ? getInitials(user.name) : '??'}
                </div>
                <div>
                  <p className="text-sm font-semibold">{user?.name || 'Loading...'}</p>
                  <p className="text-xs text-text-muted">{role.toUpperCase()} · HR Intelligence</p>
                </div>
              </div>
              <div className="py-1">
                <Link href={`/${role}/profile`} onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface transition-colors">
                  <User size={15} className="text-text-muted" /> My Profile
                </Link>
                <Link href="/auth/login" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-surface transition-colors">
                  <LogOut size={15} /> Sign Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
