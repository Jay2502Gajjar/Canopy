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

      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          className="flex-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 py-1.5 rounded-lg transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPrep?.(); }}
          className="flex-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 py-1.5 rounded-lg transition-colors border border-transparent"
        >
          Organize Meeting
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/employees/${employee.id}/resume`, '_blank');
          }}
          className="flex-shrink-0 flex items-center justify-center w-8 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          title="Download Resume"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        </button>
      </div>
    </div>
  );
}
