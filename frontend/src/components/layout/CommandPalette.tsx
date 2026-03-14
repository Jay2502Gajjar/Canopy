'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, FileText, Share2, PenLine, ArrowRight, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { mockEmployees } from '@/lib/mock-data';

interface SearchResult {
  id: string;
  type: 'employee' | 'module' | 'action';
  label: string;
  subtitle?: string;
  icon: React.ElementType;
  href: string;
}

const moduleResults: SearchResult[] = [
  { id: 'm1', type: 'module', label: 'Employee Directory', subtitle: 'Browse all employees', icon: Users, href: '/hro/employees' },
  { id: 'm2', type: 'module', label: 'Meeting Transcripts', subtitle: 'View transcripts', icon: FileText, href: '/hro/transcripts' },
  { id: 'm3', type: 'module', label: 'Org Memory Graph', subtitle: 'Knowledge graph', icon: Share2, href: '/hro/graph' },
  { id: 'm4', type: 'module', label: 'Manual Notes', subtitle: 'Employee notes', icon: PenLine, href: '/hro/notes' },
];

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useAppStore.getState().isCommandPaletteOpen
          ? closeCommandPalette()
          : useAppStore.getState().openCommandPalette();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeCommandPalette]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCommandPaletteOpen]);

  const employeeResults: SearchResult[] = mockEmployees
    .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.department.toLowerCase().includes(query.toLowerCase()))
    .map((e) => ({
      id: e.id,
      type: 'employee' as const,
      label: e.name,
      subtitle: `${e.role} · ${e.department}`,
      icon: Users,
      href: `/hro/employees/${e.id}`,
    }));

  const filteredModules = moduleResults.filter((m) =>
    m.label.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [...employeeResults, ...filteredModules];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((v) => Math.min(v + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((v) => Math.max(v - 1, 0));
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCommandPalette}
            className="fixed inset-0 bg-black/50 z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed top-[20%] left-1/2 -translate-x-1/2 z-[60]',
              'w-full max-w-lg',
              'bg-surface-card border border-border rounded-xl shadow-2xl overflow-hidden'
            )}
          >
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search size={18} className="text-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search employees, modules, actions..."
                className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-text-muted"
              />
              <kbd className="text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 font-mono text-text-muted">
                ESC
              </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              {allResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-text-muted text-sm">
                  No results found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <>
                  {employeeResults.length > 0 && (
                    <div className="px-3 py-1">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-1">Employees</span>
                    </div>
                  )}
                  {employeeResults.map((result, i) => {
                    const Icon = result.icon;
                    const globalIndex = i;
                    return (
                      <button
                        key={result.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                          selectedIndex === globalIndex ? 'bg-primary/10 text-primary' : 'hover:bg-surface'
                        )}
                        onClick={closeCommandPalette}
                      >
                        <Icon size={16} className="text-text-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{result.label}</span>
                          {result.subtitle && (
                            <span className="text-text-muted text-xs ml-2">{result.subtitle}</span>
                          )}
                        </div>
                        <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                  {filteredModules.length > 0 && (
                    <div className="px-3 py-1 mt-1">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-1">Modules</span>
                    </div>
                  )}
                  {filteredModules.map((result, i) => {
                    const Icon = result.icon;
                    const globalIndex = employeeResults.length + i;
                    return (
                      <button
                        key={result.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                          selectedIndex === globalIndex ? 'bg-primary/10 text-primary' : 'hover:bg-surface'
                        )}
                        onClick={closeCommandPalette}
                      >
                        <Icon size={16} className="text-text-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{result.label}</span>
                          {result.subtitle && (
                            <span className="text-text-muted text-xs ml-2">{result.subtitle}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
