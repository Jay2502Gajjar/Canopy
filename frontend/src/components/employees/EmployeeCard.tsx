'use client';

import React from 'react';
import { cn, getInitials } from '@/lib/utils';
import { MemoryScoreBar } from './MemoryScoreBar';
import { SentimentSparkline } from '../shared/SentimentSparkline';
import type { Employee } from '@/types/employee';

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
  onPrep?: () => void;
  className?: string;
}

export function EmployeeCard({ employee, onClick, onPrep, className }: EmployeeCardProps) {
  const sentimentDot = employee.sentimentScore >= 70 ? 'bg-success' :
    employee.sentimentScore >= 40 ? 'bg-warning' : 'bg-danger';

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface-card border border-border rounded-xl p-4 cursor-pointer group',
        'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
            {getInitials(employee.name)}
          </div>
          <span className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-card',
            sentimentDot
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {employee.name}
          </h3>
          <p className="text-xs text-text-muted truncate">{employee.role}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {employee.department}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Sentiment</span>
          <SentimentSparkline data={employee.sentimentHistory} width={60} height={18} />
        </div>
        <div>
          <span className="text-[11px] text-text-muted">Memory</span>
          <MemoryScoreBar score={employee.memoryScore} className="mt-0.5" />
        </div>
      </div>

    </div>
  );
}
