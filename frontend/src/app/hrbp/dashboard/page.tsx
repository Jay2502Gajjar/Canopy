'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Calendar, AlertTriangle, BarChart2, TrendingDown, TrendingUp, CalendarCheck, Sparkles
} from 'lucide-react';
import { cn, getGreeting, formatDate, getInitials } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { SentimentSparkline } from '@/components/shared/SentimentSparkline';
import { PrepModal } from '@/components/shared/PrepModal';
import { AddUserModal } from '@/components/shared/AddUserModal';
import { mockEmployees, mockCommitments, mockMeetings, mockDepartments } from '@/lib/mock-data';

export default function HRBPDashboard() {
  const [resolvedSet, setResolvedSet] = useState<Set<string>>(new Set());
  const [prepEmpId, setPrepEmpId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [commitments, setCommitments] = useState(mockCommitments);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const assignedDepts = ['Engineering', 'Product'];

  const deptEmployees = mockEmployees.filter((e) => assignedDepts.includes(e.department));
  const needsAttention = deptEmployees.filter((e) => e.riskTier === 'critical' || e.riskTier === 'concern').slice(0, 5);
  const upcomingMeetings = mockMeetings.filter((m) => assignedDepts.includes(m.employeeDept)).slice(0, 4);
  const deptSentiment = mockDepartments.filter((d) => assignedDepts.includes(d.name));

  // Sorting priorities (#2)
  const priorityOrder: Record<string, number> = { overdue: 0, due_soon: 1, on_track: 2 };
  const openCommitments = commitments.filter((c) => {
    const emp = mockEmployees.find((e) => e.id === c.employeeId);
    return emp && assignedDepts.includes(emp.department) && !c.resolved;
  }).sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
  const markedCommitments = commitments.filter((c) => {
    const emp = mockEmployees.find((e) => e.id === c.employeeId);
    return emp && assignedDepts.includes(emp.department) && c.resolved;
  });

  const toggleCommitment = (id: string) => {
    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome — same structure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">{getGreeting()}, Priya</h1>
          <p className="text-sm text-text-muted mt-0.5">
            You manage: <span className="font-medium text-primary">{assignedDepts.join(', ')}</span>
          </p>
          <p className="text-sm text-text-muted mt-0.5 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-warning" />
            {needsAttention.length} employees need attention this week
          </p>
        </div>
      </div>

      {/* Row 1: Metrics — same order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="My Employees" value={deptEmployees.length} icon={Users} employees={deptEmployees.slice(0, 5)} onPrepClick={setPrepEmpId} />
        <MetricCard title="At Retention Risk" value={needsAttention.length} icon={AlertTriangle} employees={needsAttention} onPrepClick={setPrepEmpId} />
        <MetricCard title="Dept Engagement" value={deptSentiment[0]?.engagementScore || 62} icon={BarChart2} delta={deptSentiment[0]?.delta || 0} />
        <MetricCard title="Upcoming Meetings" value={upcomingMeetings.length} icon={CalendarCheck} meetings={upcomingMeetings} onPrepClick={setPrepEmpId} />
      </div>

      {/* HR Team Quick Review (#6, #4, #5, #10) */}
      <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold font-heading">Your HR Team</h2>
          <div className="flex items-center gap-3 text-xs font-medium">
            <button onClick={() => setIsAddMemberOpen(true)} className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1">+ Add Member</button>
            <Link href="/hrbp/access-control" className="text-text-muted hover:text-foreground transition-colors">View all →</Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: '1', name: 'Jay Gajjar', role: 'HRO', dept: 'All Departments', notes: 12, meetings: 8 },
            { id: '2', name: 'Vikram Patel', role: 'CHRO', dept: 'Executive Oversight', notes: 5, meetings: 3 },
          ].map((hr) => (
            <Link key={hr.name} href={`/hrbp/employees/${hr.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface/80 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                {hr.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{hr.name}</p>
                <p className="text-[10px] text-text-muted">{hr.role} · {hr.dept}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{hr.notes} notes · {hr.meetings} meetings</p>
              </div>
              <span className="text-[10px] font-semibold bg-success/10 text-success px-2 py-0.5 rounded-full">Active</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 2: Three Columns — same order: Needs Attention, Commitments, Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold font-heading flex items-center gap-2"><AlertTriangle size={15} className="text-warning" /> Needs Attention</h2>
            <Link href="/hrbp/risk" className="text-xs text-primary font-medium hover:text-primary-dark">View all →</Link>
          </div>
          <div className="space-y-3">
            {needsAttention.map((emp) => (
              <Link href={`/hrbp/employees/${emp.id}`} key={emp.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{getInitials(emp.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary">{emp.name}</p>
                  <p className="text-xs text-text-muted">{emp.department}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RiskBadge tier={emp.riskTier} />
                  <SentimentSparkline data={emp.sentimentHistory} width={48} height={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Commitments — uniform */}
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
                  <p className="text-xs text-text-muted mt-0.5">{c.employeeName} · Due {formatDate(c.dueDate)}</p>
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

        {/* Meetings — uniform */}
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <h2 className="text-sm font-semibold font-heading mb-4">Upcoming Meetings</h2>
          <div className="space-y-3">
            {upcomingMeetings.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{getInitials(m.employeeName)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.employeeName}</p>
                  <p className="text-xs text-text-muted">{formatDate(m.date)} · {m.time}</p>
                </div>
                <button onClick={() => setPrepEmpId(m.employeeId)}
                  className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors">Prep</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Sentiment + Dept — uniform */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <h2 className="text-sm font-semibold font-heading mb-4">Department Sentiment</h2>
          {deptSentiment.map((dept) => (
            <div key={dept.id} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{dept.name}</span>
                <div className="flex items-center gap-1">
                  {dept.delta > 0 ? <TrendingUp size={12} className="text-success" /> : <TrendingDown size={12} className="text-danger" />}
                  <span className={cn('text-xs font-semibold', dept.delta > 0 ? 'text-success' : 'text-danger')}>{dept.delta > 0 ? '+' : ''}{dept.delta}</span>
                </div>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', dept.engagementScore >= 75 ? 'bg-success' : dept.engagementScore >= 50 ? 'bg-warning' : 'bg-danger')}
                  style={{ width: `${dept.engagementScore}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <h2 className="text-sm font-semibold font-heading mb-4">Department Engagement</h2>
          <div className="space-y-3">
            {deptSentiment.map((dept) => (
              <div key={dept.id} className="flex items-center gap-3">
                <span className="text-sm min-w-[100px]">{dept.name}</span>
                <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', dept.engagementScore >= 75 ? 'bg-success' : dept.engagementScore >= 50 ? 'bg-warning' : 'bg-danger')}
                    style={{ width: `${dept.engagementScore}%` }} />
                </div>
                <span className="text-sm font-semibold w-8 text-right">{dept.engagementScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PrepModal employeeId={prepEmpId || ''} isOpen={!!prepEmpId} onClose={() => setPrepEmpId(null)} />

      {/* Add Member Modal (#1) */}
      <AddUserModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add HR Team Member" defaultRole="HRO" />
    </div>
  );
}
