'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar, Briefcase, MapPin, Clock, User, TrendingUp,
  MessageSquare, Target, AlertCircle, FileText, ChevronRight, PenLine, CheckCircle2, Sparkles, Trash2, Loader2
} from 'lucide-react';
import { cn, getInitials, formatDate, getGreeting } from '@/lib/utils';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { MemoryScoreBar } from '@/components/employees/MemoryScoreBar';
import { SentimentSparkline } from '@/components/shared/SentimentSparkline';
import { AddNoteModal } from '@/components/shared/AddNoteModal';
import { OrganizeMeetingModal } from '@/components/shared/OrganizeMeetingModal';
import { employeeApi, transcriptApi, commitmentApi, noteApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const tabs = ['Overview', 'AI Analysis', 'Meeting History', 'Commitments'];

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);

  const employeeId = params.id as string;

  const { data: employee, isLoading: isLoadingEmp } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeApi.getById(employeeId),
  });

  const { data: empCommitments = [], isLoading: isLoadingComm } = useQuery({
    queryKey: ['commitments', employeeId],
    queryFn: () => commitmentApi.getAll(), // Ideally filter by employee on backend
    select: (data) => data.filter((c: any) => c.employeeId === employeeId)
  });

  const { data: empTranscripts = [], isLoading: isLoadingTrans } = useQuery({
    queryKey: ['transcripts', employeeId],
    queryFn: () => transcriptApi.getByEmployee(employeeId),
  });

  const { data: empNotes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes', employeeId],
    queryFn: () => noteApi.getByEmployee(employeeId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => employeeApi.delete(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['recent-changes'] });
      router.push('/hro/employees');
    }
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${employee?.name}'s profile? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const priorityOrder: Record<string, number> = { overdue: 0, due_soon: 1, on_track: 2 };
  const openCommitments = empCommitments.filter((c: any) => !c.resolved).sort((a: any, b: any) => priorityOrder[a.status] - priorityOrder[b.status]);

  if (isLoadingEmp) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Employee not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {getInitials(employee.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-1">
              <h1 className="text-2xl font-bold font-heading">{employee.name}</h1>
              <RiskBadge tier={employee.riskTier} />
            </div>
            <p className="text-sm text-text-muted">{employee.role} · {employee.department}</p>
            <p className="text-xs text-text-muted mt-1">ID: {employee.employeeId} · Tenure: {employee.tenure}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock size={12} /> Last interaction: {formatDate(employee.lastInteraction)}
              </span>
              <SentimentSparkline data={employee.sentimentHistory} width={80} height={20} />
            </div>
            <div className="mt-3">
              <span className="text-xs text-text-muted">Memory Confidence</span>
              <MemoryScoreBar score={employee.memoryScore} className="mt-1 max-w-xs" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button onClick={() => setIsMeetingOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
              <Calendar size={13} /> Organize Meeting
            </button>
            <button onClick={() => setIsNoteOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
              <PenLine size={13} /> Add Note
            </button>
            <button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete Profile
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === i
                ? 'bg-surface-card text-primary shadow-sm'
                : 'text-text-muted hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* HRMS Data */}
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold font-heading mb-3 flex items-center gap-2">
                <Briefcase size={15} className="text-primary" /> Employment Details
              </h3>
              <div className="space-y-2.5">
                {[
                  ['Joining Date', formatDate(employee.joinDate)],
                  ['Tenure', employee.tenure],
                  ['Reporting Manager', employee.reportingManager],
                  ['Department', employee.department],
                  ['Employment Type', employee.employmentType],
                  ['Email', employee.email],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills & Projects */}
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold font-heading mb-3 flex items-center gap-2">
                <Target size={15} className="text-primary" /> Skills & Projects
              </h3>
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {employee.skills.map((s: string) => (
                    <span key={s} className="text-[11px] font-medium bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1.5">Projects</p>
                <div className="flex flex-wrap gap-1.5">
                  {employee.projects.map((p: string) => (
                    <span key={p} className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            {/* Interests & Aspirations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold font-heading mb-3">Personal Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {employee.interests.map((i: string) => (
                    <span key={i} className="text-xs bg-secondary/10 text-secondary px-2.5 py-1 rounded-full font-medium">{i}</span>
                  ))}
                </div>
              </div>
              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold font-heading mb-3">Career Aspirations</h3>
                <ul className="space-y-2">
                  {employee.careerAspirations.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <TrendingUp size={14} className="text-primary mt-0.5 flex-shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Concerns */}
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold font-heading mb-3">Concerns Raised</h3>
              {employee.concerns.length === 0 ? (
                <p className="text-sm text-text-muted">No concerns recorded.</p>
              ) : (
                <div className="space-y-2">
                  {employee.concerns.map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-warning/[0.04] border-l-[3px] border-l-warning">
                      <AlertCircle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm">{c.text}</p>
                        <p className="text-xs text-text-muted mt-1">{c.meetingRef} · {formatDate(c.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Sentiment Notes (#11) */}
            <div className="bg-surface-card border border-border rounded-xl p-5 border-l-[3px] border-l-primary/60">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-primary" />
                <h3 className="text-sm font-semibold font-heading">AI Sentiment Notes</h3>
              </div>
              <div className="space-y-3">
                {empNotes.length === 0 ? (
                  <p className="text-sm text-text-muted">No AI sentiment notes available.</p>
                ) : empNotes.slice(0, 5).map((note: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{note.content}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">From: {note.meetingContext || 'HR Note'} · {formatDate(note.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Chart */}
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold font-heading mb-4">Sentiment Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={employee.sentimentHistory}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F766E" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#0F766E" fill="url(#sentGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Duration</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">AI Status</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {empTranscripts.map((t: any) => (
                  <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3">{formatDate(t.date)}</td>
                    <td className="px-3 py-3 capitalize">{t.meetingType}</td>
                    <td className="px-3 py-3 text-text-muted">{t.duration}</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
                        t.aiStatus === 'analysed' ? 'bg-success/10 text-success' :
                        t.aiStatus === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-text-muted/10 text-text-muted'
                      )}>
                        {t.aiStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/hro/transcripts/${t.id}`} className="text-xs text-primary font-medium hover:text-primary-dark">View →</Link>
                    </td>
                  </tr>
                ))}
                {empTranscripts.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-text-muted text-sm">No transcripts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold font-heading mb-3">Open Commitments</h3>
              <div className="space-y-2">
                {openCommitments.map((c: any) => (
                  <div key={c.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border-l-[3px]',
                    c.status === 'overdue' ? 'border-l-danger bg-danger/[0.03]' :
                    c.status === 'due_soon' ? 'border-l-warning bg-warning/[0.03]' :
                    'border-l-success bg-success/[0.03]'
                  )}>
                    <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.text}</p>
                      <p className="text-xs text-text-muted mt-1">
                        From: {c.sourceMeteting} ({formatDate(c.sourceMeetingDate)}) · Due: {formatDate(c.dueDate)}
                      </p>
                    </div>
                  </div>
                ))}
                {openCommitments.length === 0 && (
                  <p className="text-sm text-text-muted py-2">No open commitments</p>
                )}
              </div>
            </div>
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold font-heading mb-3">Resolved Commitments</h3>
              <div className="space-y-2">
                {empCommitments.filter((c: any) => c.resolved).map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface/50 opacity-60">
                    <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm line-through">{c.text}</p>
                      <p className="text-xs text-text-muted mt-1">Resolved · From: {c.sourceMeteting}</p>
                    </div>
                  </div>
                ))}
                {empCommitments.filter((c) => c.resolved).length === 0 && (
                  <p className="text-sm text-text-muted py-2">No resolved commitments</p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Note Modal (#6) */}
      <AddNoteModal 
        isOpen={isNoteOpen} 
        onClose={() => {
          setIsNoteOpen(false);
          queryClient.invalidateQueries({ queryKey: ['notes', employeeId] });
        }} 
        employeeId={employeeId}
        employeeName={employee.name} 
      />
      {/* Organize Meeting Modal */}
      <OrganizeMeetingModal
        isOpen={isMeetingOpen}
        onClose={() => setIsMeetingOpen(false)}
        employeeId={employeeId}
        employeeName={employee.name}
        employeeDept={employee.department}
      />
    </div>
  );
}
