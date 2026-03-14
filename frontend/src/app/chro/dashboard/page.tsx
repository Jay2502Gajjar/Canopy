'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Calendar, AlertTriangle, BarChart2, TrendingDown, TrendingUp, Minus, CalendarCheck, Sparkles
} from 'lucide-react';
import { cn, getGreeting, formatDate } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { AddUserModal } from '@/components/shared/AddUserModal';
import { PrepModal } from '@/components/shared/PrepModal';
import { mockEmployees, mockDepartments, mockCommitments, mockMeetings } from '@/lib/mock-data';

export default function CHRODashboard() {
  const [resolvedSet, setResolvedSet] = useState<Set<string>>(new Set());
  const [prepEmpId, setPrepEmpId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [commitments, setCommitments] = useState(mockCommitments);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const riskEmployees = mockEmployees.filter((e) => e.riskTier === 'critical' || e.riskTier === 'concern');
  const upcomingMeetings = mockMeetings.slice(0, 4);

  // Sorting priorities (#2)
  const priorityOrder: Record<string, number> = { overdue: 0, due_soon: 1, on_track: 2 };
  const openCommitments = commitments.filter((c) => !c.resolved).sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
  const markedCommitments = commitments.filter((c) => c.resolved);

  const toggleCommitment = (id: string) => {
    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  };

  const deptStatusLabels: Record<string, string> = {
    stable: 'Stable', declining: 'Declining', burnout_signals: 'Burnout Signals', low_hr_coverage: 'Low Coverage',
  };
  const deptStatusColors: Record<string, string> = {
    stable: 'bg-success/10 text-success', declining: 'bg-danger/10 text-danger',
    burnout_signals: 'bg-warning/10 text-warning', low_hr_coverage: 'bg-secondary/10 text-secondary',
  };
  const sortedDepts = [...mockDepartments].sort((a, b) => {
    const order: Record<string, number> = { burnout_signals: 0, declining: 1, low_hr_coverage: 2, stable: 3 };
    return (order[a.sentimentStatus] || 3) - (order[b.sentimentStatus] || 3);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome — same structure as HRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">{getGreeting()}, Vikram</h1>
          <p className="text-sm text-text-muted mt-0.5">Executive Overview · Organizational Health at a Glance</p>
        </div>
      </div>

      {/* Row 1: Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Employees" value={152} icon={Users} employees={mockEmployees.slice(0, 5)} onPrepClick={setPrepEmpId} />
        <MetricCard title="Attrition Risk" value={riskEmployees.length} icon={AlertTriangle} delta={2} deltaLabel="vs last month" employees={riskEmployees} onPrepClick={setPrepEmpId} />
        <MetricCard title="Engagement Score" value="64" icon={BarChart2} delta={-3} deltaLabel="trend" subtitle="out of 100" />
        <MetricCard title="Upcoming Meetings" value={upcomingMeetings.length} icon={CalendarCheck} subtitle="Scheduled" meetings={upcomingMeetings} onPrepClick={setPrepEmpId} />
      </div>

      {/* HR Team Quick Review (#6, #4, #5, #10) */}
      <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold font-heading">Your HR Team</h2>
          <div className="flex items-center gap-3 text-xs font-medium">
            <button onClick={() => setIsAddMemberOpen(true)} className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1">+ Add Member</button>
            <Link href="/hr/access-control" className="text-text-muted hover:text-foreground transition-colors">View all →</Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: '1', name: 'Sarah Mitchell', role: 'HRO', dept: 'All Departments', status: 'Active', notes: 12, meetings: 8 },
            { id: '3', name: 'Priya Sharma', role: 'HRBP', dept: 'Engineering, Product', status: 'Active', notes: 9, meetings: 5 },
            { id: '4', name: 'Ankit Verma', role: 'HRBP', dept: 'Sales, Marketing', status: 'Active', notes: 7, meetings: 4 },
          ].map((hr) => (
            <Link key={hr.name} href={`/hr/employees/${hr.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface/80 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                {hr.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{hr.name}</p>
                <p className="text-[10px] text-text-muted">{hr.role} · {hr.dept}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{hr.notes} notes · {hr.meetings} meetings</p>
              </div>
              <span className="text-[10px] font-semibold bg-success/10 text-success px-2 py-0.5 rounded-full">{hr.status}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 2: Three columns — Needs Attention, Commitments, Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Org Sentiment / Needs Attention */}
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <h2 className="text-sm font-semibold font-heading mb-4 flex items-center gap-2"><AlertTriangle size={15} className="text-warning" /> Top Workforce Alerts</h2>
          <div className="space-y-3">
            {[
              { severity: 'critical', text: 'Burnout signals in Engineering — 4 affected', dept: 'Engineering' },
              { severity: 'concern', text: 'Sales attrition risk rising — 2 reps left', dept: 'Sales' },
              { severity: 'watch', text: 'Finance has low HR coverage — 1 meeting/30d', dept: 'Finance' },
            ].map((alert, i) => (
              <div key={i} className={cn('p-3 rounded-lg border-l-[3px]',
                alert.severity === 'critical' ? 'border-l-danger bg-danger/[0.03]' :
                alert.severity === 'concern' ? 'border-l-warning bg-warning/[0.03]' : 'border-l-secondary bg-secondary/[0.03]')}>
                <p className="text-sm">{alert.text}</p>
                <p className="text-xs text-text-muted mt-1">{alert.dept}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Commitments — uniform with HRO */}
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold font-heading">Pending Commitments</h2>
            <span className="text-xs text-text-muted">{openCommitments.length} open</span>
          </div>
          <div className="space-y-2">
            {openCommitments.map((c) => (
              <div key={c.id} className={cn('flex items-start gap-3 p-2.5 rounded-lg border-l-[3px]',
                c.status === 'overdue' ? 'border-l-danger bg-danger/[0.03]' : c.status === 'due_soon' ? 'border-l-warning bg-warning/[0.03]' : 'border-l-success bg-success/[0.03]')}>
                <input type="checkbox" checked={c.resolved} onChange={() => toggleCommitment(c.id)} className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.text}</p>
                    <span className={cn('flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0',
                      c.status === 'overdue' ? 'bg-danger/10 text-danger' : c.status === 'due_soon' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
                      <Sparkles size={8} /> {c.status === 'overdue' ? 'High Priority' : c.status === 'due_soon' ? 'Med Priority' : 'Low Priority'}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{c.employeeName}</p>
                </div>
              </div>
            ))}
            {markedCommitments.length > 0 && (
              <>
                <div className="border-t border-border mt-2 pt-2"><p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Resolved ({markedCommitments.length})</p></div>
                {markedCommitments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface/50 opacity-60">
                    <input type="checkbox" checked={c.resolved} onChange={() => toggleCommitment(c.id)} className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                    <p className="text-sm font-medium line-through flex-1">{c.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* HRBP Coverage */}
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <h2 className="text-sm font-semibold font-heading mb-4">HRBP Coverage</h2>
          <div className="space-y-2.5">
            {mockDepartments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors">
                <span className="text-sm font-medium min-w-[80px]">{dept.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{dept.meetingsLast30d} mtg/mo</span>
                  <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                    dept.meetingsLast30d >= 4 ? 'bg-success/10 text-success' : dept.meetingsLast30d >= 2 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger')}>
                    {dept.meetingsLast30d >= 4 ? 'Good' : dept.meetingsLast30d >= 2 ? 'Low' : 'Critical'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Sentiment + Engagement — uniform with HRO */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <h2 className="text-sm font-semibold font-heading mb-4">Org Sentiment Health</h2>
          <div className="text-center">
            <div className="text-5xl font-bold font-heading text-primary">64</div>
            <p className="text-sm text-text-muted mt-1">out of 100</p>
            <div className="flex items-center justify-center gap-1 mt-2"><TrendingDown size={14} className="text-warning" /><span className="text-xs font-semibold text-warning">Slight decline</span></div>
          </div>
          <div className="mt-5 space-y-2">
            {[{ label: 'Positive', pct: 42, color: 'bg-success' }, { label: 'Neutral', pct: 33, color: 'bg-warning' }, { label: 'Negative', pct: 25, color: 'bg-danger' }].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-16">{s.label}</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden"><div className={cn('h-full rounded-full', s.color)} style={{ width: `${s.pct}%` }} /></div>
                <span className="text-xs font-semibold w-8 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <h2 className="text-sm font-semibold font-heading mb-4">Department Risk Snapshot</h2>
          <div className="space-y-2.5">
            {sortedDepts.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium min-w-[100px]">{dept.name}</span>
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full', deptStatusColors[dept.sentimentStatus])}>
                    {deptStatusLabels[dept.sentimentStatus]}
                  </span>
                </div>
                <span className="text-xs text-text-muted">{dept.employeeCount} employees</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PrepModal employeeId={prepEmpId || ''} isOpen={!!prepEmpId} onClose={() => setPrepEmpId(null)} />

      {/* Add Member Modal (#1) */}
      <AddUserModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add HR Team Member" defaultRole="HRBP" />
    </div>
  );
}
