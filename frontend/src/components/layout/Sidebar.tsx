'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, FileText, AlertTriangle, Share2, PenLine,
  Activity, Bot, Shield, BarChart2, ClipboardCheck, TrendingUp,
  FileBarChart, PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  isAI?: boolean;
}

const hroNav: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/hro/dashboard' },
  { label: 'Employee Directory', icon: Users, href: '/hro/employees' },
  { label: 'ATS Pipeline', icon: FileText, href: '/hro/ats-pipeline' },
  { label: 'Meeting Transcripts', icon: FileText, href: '/hro/transcripts' },
  { label: 'Risk Analysis', icon: AlertTriangle, href: '/hro/risk' },
  { label: 'Org Memory Graph', icon: Share2, href: '/hro/graph' },
  { label: 'Manual Notes', icon: PenLine, href: '/hro/notes' },
  { label: 'Recent Changes', icon: Activity, href: '/hro/changes' },
  { label: 'AI Assistant', icon: Bot, href: '#ai', isAI: true },
  { label: 'Access Control', icon: Shield, href: '/hro/access-control' },
];

const chroNav: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/chro/dashboard' },
  { label: 'Employee Directory', icon: Users, href: '/chro/employees' },
  { label: 'Workforce Analytics', icon: BarChart2, href: '/chro/analytics' },
  { label: 'HR Governance', icon: ClipboardCheck, href: '/chro/governance' },
  { label: 'Strategic Planning', icon: TrendingUp, href: '/chro/planning' },
  { label: 'Org Memory Graph', icon: Share2, href: '/chro/graph' },
  { label: 'Executive Reports', icon: FileBarChart, href: '/chro/reports' },
  { label: 'AI Assistant', icon: Bot, href: '#ai', isAI: true },
  { label: 'Manual Notes', icon: PenLine, href: '/chro/notes' },
  { label: 'Access Control', icon: Shield, href: '/chro/access-control' },
];

const hrbpNav: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/hrbp/dashboard' },
  { label: 'Employee Directory', icon: Users, href: '/hrbp/employees' },
  { label: 'Meeting Transcripts', icon: FileText, href: '/hrbp/transcripts' },
  { label: 'Risk Insights', icon: AlertTriangle, href: '/hrbp/risk' },
  { label: 'Department Insights', icon: PieChart, href: '/hrbp/insights' },
  { label: 'Org Memory Graph', icon: Share2, href: '/hrbp/graph' },
  { label: 'Manual Notes', icon: PenLine, href: '/hrbp/notes' },
  { label: 'AI Assistant', icon: Bot, href: '#ai', isAI: true },
  { label: 'Access Control', icon: Shield, href: '/hrbp/access-control' },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'chro': return chroNav;
    case 'hrbp': return hrbpNav;
    default: return hroNav;
  }
}

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const { openAIDrawer } = useAppStore();
  const navItems = getNavItems(role);

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 240 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col',
        'bg-surface-card border-r border-border',
        'pt-[56px]'
      )}
    >
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = item.href !== '#ai' && pathname?.startsWith(item.href);
          const Icon = item.icon;

          if (item.isAI) {
            return (
              <button
                key={item.label}
                onClick={openAIDrawer}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg transition-all duration-150 group relative',
                  'h-10 px-3',
                  'bg-primary/10 hover:bg-primary/20 text-primary'
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={20} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full pulse-dot" />
                </div>
                <AnimatePresence>
                  {isHovered && (
                    <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }} className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg transition-all duration-150 group relative',
                'h-10 px-3',
                isActive
                  ? 'bg-primary/10 text-primary font-medium border-l-[3px] border-primary'
                  : 'text-text-muted hover:bg-surface hover:text-foreground'
              )}
            >
              <Icon size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {isHovered && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }} className="text-sm whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && item.badge > 0 && (
                <span className="absolute right-2 bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
