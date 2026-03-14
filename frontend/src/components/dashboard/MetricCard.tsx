'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import type { Employee, Meeting } from '@/types/employee';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  delta?: number;
  deltaLabel?: string;
  subtitle?: string;
  className?: string;
  employees?: Employee[];
  meetings?: Meeting[];
  onPrepClick?: (empId: string) => void;
}

export function MetricCard({ title, value, icon: Icon, delta, deltaLabel, subtitle, className, employees, meetings, onPrepClick }: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasEmployees = employees && employees.length > 0;
  const hasMeetings = meetings && meetings.length > 0;
  const isExpandable = hasEmployees || hasMeetings;

  return (
    <div className={cn(
      'bg-surface-card border border-border rounded-xl p-5 min-h-[120px]',
      'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5',
      isExpandable && 'cursor-pointer',
      className
    )} onClick={() => isExpandable && setExpanded(!expanded)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold font-heading mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-primary" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {delta > 0 ? <TrendingUp size={14} className="text-success" /> : delta < 0 ? <TrendingDown size={14} className="text-danger" /> : <Minus size={14} className="text-text-muted" />}
          <span className={cn('text-xs font-semibold', delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-text-muted')}>
            {delta > 0 ? '+' : ''}{delta}
          </span>
          {deltaLabel && <span className="text-xs text-text-muted">{deltaLabel}</span>}
        </div>
      )}
      {isExpandable && (
        <div className="flex items-center gap-1 mt-2">
          <ChevronDown size={12} className={cn('text-text-muted', expanded && 'rotate-180')} />
          <span className="text-[10px] text-text-muted">{expanded ? 'Hide' : 'Click to see'} details</span>
        </div>
      )}
      <AnimatePresence>
        {expanded && (hasEmployees || hasMeetings) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              {hasEmployees && employees!.slice(0, 5).map((emp) => (
                <div key={emp.id} className="flex items-center gap-2 text-sm p-1.5 rounded-lg hover:bg-surface">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                    {getInitials(emp.name)}
                  </div>
                  <span className="flex-1 truncate text-xs font-medium">{emp.name}</span>
                  <RiskBadge tier={emp.riskTier} />
                  {onPrepClick && (
                    <button onClick={(e) => { e.stopPropagation(); onPrepClick(emp.id); }}
                      className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20">Prep</button>
                  )}
                </div>
              ))}
              {hasMeetings && meetings!.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm p-1.5 rounded-lg hover:bg-surface">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                    {getInitials(m.employeeName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">{m.employeeName}</span>
                    <span className="text-[10px] text-text-muted">{formatDate(m.date)} · {m.time}</span>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{m.meetingType}</span>
                  {onPrepClick && (
                    <button onClick={(e) => { e.stopPropagation(); onPrepClick(m.employeeId); }}
                      className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20">Prep</button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
