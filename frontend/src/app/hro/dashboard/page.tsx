'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Calendar, AlertTriangle, BarChart2, TrendingDown, TrendingUp, Minus, CalendarCheck, Sparkles, Plus
} from 'lucide-react';
import { cn, getGreeting, formatDate, getInitials, formatRelativeTime } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { MemoryScoreBar } from '@/components/employees/MemoryScoreBar';
import { SentimentSparkline } from '@/components/shared/SentimentSparkline';
import { PrepModal } from '@/components/shared/PrepModal';
import { AddUserModal } from '@/components/shared/AddUserModal';
import { useAppStore } from '@/store/useAppStore';
import { employeeApi, meetingApi, commitmentApi, analyticsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function HRODashboard() {
  const [resolvedSet, setResolvedSet] = useState<Set<string>>(new Set());
  const [prepEmpId, setPrepEmpId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const { user } = useAppStore();
  const { data: employees = [], isLoading: isLoadingEmp } = useQuery({ queryKey: ['employees'], queryFn: employeeApi.getAll });
  const { data: meetings = [], isLoading: isLoadingMeet } = useQuery({ queryKey: ['meetings'], queryFn: meetingApi.getAll });
  const { data: dbCommitments = [], isLoading: isLoadingCom } = useQuery({ queryKey: ['commitments'], queryFn: commitmentApi.getAll });
  const { data: analytics = null, isLoading: isLoadingAnalytics } = useQuery({ queryKey: ['analytics_sentiment'], queryFn: analyticsApi.getSentimentTrends });

  React.useEffect(() => {
    setIsClient(true);
    if (dbCommitments.length > 0) {
      setCommitments(dbCommitments);
    }
  }, [dbCommitments]);

  const isLoading = isLoadingEmp;

  // Sorting priorities (#2)
  const priorityOrder: Record<string, number> = { overdue: 0, due_soon: 1, on_track: 2 };
  const openCommitments = commitments.filter((c: any) => !c.resolved).sort((a: any, b: any) => priorityOrder[a.status] - priorityOrder[b.status]);
  const markedCommitments = commitments.filter((c: any) => c.resolved);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Derived state from live data
  const needsAttention = employees.filter((e: any) => e.riskTier === 'critical' || e.riskTier === 'concern').slice(0, 5);
  const riskEmployees = employees.filter((e: any) => e.riskTier === 'critical' || e.riskTier === 'concern');
  const leaveEmployees = employees.slice(0, 3);
  const upcomingMeetings = meetings.slice(0, 4);
  
  // Create mock departments if backend doesn't provide them via stats yet
  const liveDepartments = [...new Set(employees.map((e: any) => e.department))].filter(Boolean).map((d: any, i) => ({
    id: `d${i}`,
    name: d,
    engagementScore: Math.floor(Math.random() * (95 - 60 + 1) + 60),
    delta: Math.floor(Math.random() * 5) - 2
  }));

  const toggleCommitment = (id: string) => {
    setCommitments((prev: any[]) =>
      prev.map((c: any) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">{getGreeting()}, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-sm text-text-muted mt-0.5">Here's the org status at a glance</p>
        </div>
        <button onClick={() => setIsAddEmployeeOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Row 1: Metrics with expandable employees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Employees" value={employees.length} icon={Users} delta={3} deltaLabel="this month" employees={employees.slice(0, 5)} onPrepClick={setPrepEmpId} />
        <MetricCard title="On Leave" value={leaveEmployees.length} icon={Calendar} subtitle="3 sick, 5 annual" employees={leaveEmployees} onPrepClick={setPrepEmpId} />
        <MetricCard title="At Retention Risk" value={riskEmployees.length} icon={AlertTriangle} delta={2} deltaLabel="from last month" employees={riskEmployees} onPrepClick={setPrepEmpId} />
        <MetricCard title="Upcoming Meetings" value={upcomingMeetings.length} icon={CalendarCheck} subtitle="Next 7 days" meetings={upcomingMeetings} onPrepClick={setPrepEmpId} />
      </div>

      {/* Row 2: Three Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Needs Attention */}
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold font-heading flex items-center gap-2"><AlertTriangle size={15} className="text-warning" /> Needs Attention</h2>
            <Link href="/hro/risk" className="text-xs text-primary font-medium hover:text-primary-dark transition-colors">View all →</Link>
          </div>
          <div className="space-y-3">
            {needsAttention.map((emp: any) => (
              <Link href={`/hro/employees/${emp.id}`} key={emp.id}
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

        {/* Pending Commitments — mark below instead of remove */}
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold font-heading">Pending Commitments</h2>
            <span className="text-xs text-text-muted">{openCommitments.length} open</span>
          </div>
          <div className="space-y-2">
            {openCommitments.map((c: any) => (
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
                <div className="border-t border-border mt-2 pt-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Resolved ({markedCommitments.length})</p>
                </div>
                {markedCommitments.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface/50 opacity-60">
                    <input type="checkbox" checked={true} onChange={() => toggleCommitment(c.id)} className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                    <p className="text-sm font-medium line-through flex-1">{c.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold font-heading">Upcoming Meetings</h2>
          </div>
          <div className="space-y-3">
            {upcomingMeetings.map((m: any) => (
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

      {/* Row 3: Sentiment + Dept */}
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
          <h2 className="text-sm font-semibold font-heading mb-4">Department Engagement</h2>
          <div className="space-y-3">
            {liveDepartments.map((dept: any) => (
              <div key={dept.id} className="flex items-center gap-3">
                <span className="text-sm min-w-[100px] truncate">{dept.name}</span>
                <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', dept.engagementScore >= 75 ? 'bg-success' : dept.engagementScore >= 50 ? 'bg-warning' : 'bg-danger')}
                    style={{ width: `${dept.engagementScore}%` }} />
                </div>
                <span className="text-sm font-semibold w-8 text-right">{dept.engagementScore}</span>
                <div className="flex items-center gap-0.5 w-12">
                  {dept.delta > 0 ? <><TrendingUp size={12} className="text-success" /><span className="text-[11px] text-success font-semibold">+{dept.delta}</span></> :
                   dept.delta < 0 ? <><TrendingDown size={12} className="text-danger" /><span className="text-[11px] text-danger font-semibold">{dept.delta}</span></> :
                   <><Minus size={12} className="text-text-muted" /><span className="text-[11px] text-text-muted font-semibold">0</span></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Employee Table */}
      <div className="bg-surface-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-sm font-semibold font-heading">Employee Memory Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-5 py-3">Employee</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Department</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Last Interaction</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Sentiment</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Memory</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.slice(0, 10).map((emp: any) => (
                <tr key={emp.id} className="hover:bg-surface/50 transition-colors group">
                  <td className="px-5 py-3">
                    <Link href={`/hro/employees/${emp.id}`} className="flex items-center gap-3 group/link">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{getInitials(emp.name)}</div>
                      <span className="font-medium group-hover/link:text-primary transition-colors">{emp.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3"><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{emp.department}</span></td>
                  <td className="px-3 py-3 text-text-muted text-xs">{formatRelativeTime(emp.lastInteraction)}</td>
                  <td className="px-3 py-3"><SentimentSparkline data={emp.sentimentHistory} /></td>
                  <td className="px-3 py-3 min-w-[120px]"><MemoryScoreBar score={emp.memoryScore} /></td>
                  <td className="px-3 py-3"><RiskBadge tier={emp.riskTier} /></td>
                  <td className="px-3 py-3">
                    <button onClick={() => setPrepEmpId(emp.id)}
                      className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100">Prep →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently Viewed */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-xs text-text-muted font-medium whitespace-nowrap">Recently viewed:</span>
        {employees.slice(0, 6).map((emp: any) => (
          <Link href={`/hro/employees/${emp.id}`} key={emp.id}
            className="flex items-center gap-2 bg-surface-card border border-border rounded-full px-3 py-1.5 hover:border-primary/30 transition-colors flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">{getInitials(emp.name)}</div>
            <span className="text-xs font-medium whitespace-nowrap">{emp.name.split(' ')[0]}</span>
          </Link>
        ))}
      </div>

      <PrepModal employeeId={prepEmpId || ''} isOpen={!!prepEmpId} onClose={() => setPrepEmpId(null)} />

      {/* Add Employee Modal (#1) */}
      <AddUserModal isOpen={isAddEmployeeOpen} onClose={() => setIsAddEmployeeOpen(false)} title="Add Employee" defaultRole="Employee" />
    </div>
  );
}
