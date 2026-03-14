'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  tier: 'critical' | 'concern' | 'watch' | 'stable';
  className?: string;
}

const tierConfig = {
  critical: { label: 'Critical', bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30' },
  concern: { label: 'Concern', bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  watch: { label: 'Watch', bg: 'bg-amber-400/10', text: 'text-amber-500', border: 'border-amber-400/30' },
  stable: { label: 'Stable', bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
};

export function RiskBadge({ tier, className }: RiskBadgeProps) {
  const config = tierConfig[tier];
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border',
      config.bg, config.text, config.border,
      className
    )}>
      {config.label}
    </span>
  );
}
