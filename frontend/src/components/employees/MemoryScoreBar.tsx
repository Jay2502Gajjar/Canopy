'use client';

import React from 'react';
import { cn, getMemoryScoreLabel, getMemoryScoreColor } from '@/lib/utils';

interface MemoryScoreBarProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export function MemoryScoreBar({ score, showLabel = true, className }: MemoryScoreBarProps) {
  const label = getMemoryScoreLabel(score);
  const color = getMemoryScoreColor(score);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          'text-[10px] font-semibold uppercase tracking-wide min-w-[52px]',
          score >= 70 ? 'text-primary' : score >= 40 ? 'text-warning' : 'text-danger'
        )}>
          {label}
        </span>
      )}
    </div>
  );
}
