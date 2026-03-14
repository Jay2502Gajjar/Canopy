'use client';

import React from 'react';
import { TrendingDown, TrendingUp, Users, AlertTriangle, BarChart2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockDepartments, mockEmployees, mockCommitments } from '@/lib/mock-data';

export default function HRBPInsightsPage() {
  const assignedDepts = ['Engineering', 'Product'];
  const deptData = mockDepartments.filter((d) => assignedDepts.includes(d.name));
  const deptEmployees = mockEmployees.filter((e) => assignedDepts.includes(e.department));
  const deptCommitments = mockCommitments.filter((c) => {
    const emp = mockEmployees.find((e) => e.id === c.employeeId);
    return emp && assignedDepts.includes(emp.department);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading">Department Insights</h1>
      <p className="text-sm text-text-muted">Detailed view of your assigned departments: <span className="font-medium text-primary">{assignedDepts.join(', ')}</span></p>

      {/* Dept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deptData.map((dept) => {
          const employees = deptEmployees.filter((e) => e.department === dept.name);
          const atRisk = employees.filter((e) => e.riskTier === 'critical' || e.riskTier === 'concern');
          const avgSentiment = Math.round(employees.reduce((s, e) => s + e.sentimentScore, 0) / (employees.length || 1));

          return (
            <div key={dept.id} className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-heading">{dept.name}</h3>
                <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                  dept.sentimentStatus === 'stable' ? 'bg-success/10 text-success' :
                  dept.sentimentStatus === 'burnout_signals' ? 'bg-warning/10 text-warning' :
                  dept.sentimentStatus === 'declining' ? 'bg-danger/10 text-danger' : 'bg-secondary/10 text-secondary'
                )}>{dept.sentimentStatus.replace('_', ' ')}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Employees', value: dept.employeeCount, icon: Users },
                  { label: 'Engagement', value: dept.engagementScore, icon: BarChart2 },
                  { label: 'At Risk', value: atRisk.length, icon: AlertTriangle },
                  { label: 'Avg Sentiment', value: avgSentiment, icon: TrendingDown },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2 p-2 rounded-lg bg-surface">
                    <stat.icon size={14} className="text-primary" />
                    <div>
                      <p className="text-lg font-bold font-heading">{stat.value}</p>
                      <p className="text-[10px] text-text-muted uppercase">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <p className="text-xs text-text-muted mb-1.5">Engagement trend</p>
                <div className="h-2.5 bg-border rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', dept.engagementScore >= 75 ? 'bg-success' : dept.engagementScore >= 50 ? 'bg-warning' : 'bg-danger')}
                    style={{ width: `${dept.engagementScore}%` }} />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {dept.delta > 0 ? <TrendingUp size={12} className="text-success" /> : <TrendingDown size={12} className="text-danger" />}
                  <span className={cn('text-xs font-semibold', dept.delta > 0 ? 'text-success' : 'text-danger')}>{dept.delta > 0 ? '+' : ''}{dept.delta} this month</span>
                </div>
              </div>

              {atRisk.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-1.5">At-risk employees</p>
                  <div className="space-y-1">
                    {atRisk.map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-sm p-1.5 rounded-lg hover:bg-surface transition-colors">
                        <span className="font-medium">{e.name}</span>
                        <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                          e.riskTier === 'critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning')}>{e.riskTier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Commitments */}
      <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
        <h3 className="text-sm font-semibold font-heading mb-4 flex items-center gap-2"><Calendar size={14} className="text-primary" /> Dept Commitments</h3>
        <div className="space-y-2">
          {deptCommitments.map((c) => (
            <div key={c.id} className={cn('flex items-center gap-3 p-2.5 rounded-lg border-l-[3px]',
              c.status === 'overdue' ? 'border-l-danger bg-danger/[0.03]' : c.status === 'due_soon' ? 'border-l-warning bg-warning/[0.03]' :
              c.resolved ? 'border-l-success/30 bg-surface/50 opacity-60' : 'border-l-success bg-success/[0.03]')}>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', c.resolved && 'line-through')}>{c.text}</p>
                <p className="text-xs text-text-muted mt-0.5">{c.employeeName}</p>
              </div>
              <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                c.resolved ? 'bg-success/10 text-success' : c.status === 'overdue' ? 'bg-danger/10 text-danger' : c.status === 'due_soon' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
              )}>{c.resolved ? 'done' : c.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
