'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Upload, FileText, Filter, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { transcriptApi, employeeApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TranscriptsPage() {
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTab, setUploadTab] = useState<'text' | 'audio'>('text');
  
  const [content, setContent] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [meetingType, setMeetingType] = useState('');

  const queryClient = useQueryClient();

  const { data: transcripts = [], isLoading: isLoadingTranscripts } = useQuery({ queryKey: ['transcripts'], queryFn: transcriptApi.getAll });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeeApi.getAll });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => transcriptApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcripts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-changes'] });
      setShowUpload(false);
      setContent('');
      setSelectedEmployee('');
      setMeetingType('');
    }
  });

  const handleUpload = () => {
    if (!content || !selectedEmployee) return;
    
    // Find employee details for the backend payload
    const emp = employees.find((e: any) => e.id === selectedEmployee);
    
    uploadMutation.mutate({
      employeeId: selectedEmployee,
      employeeName: emp?.name,
      employeeDept: emp?.department,
      meetingType: meetingType || 'Check-in',
      duration: '30m', // default mock duration
      content: content
    });
  };

  const filtered = transcripts.filter(
    (t: any) => t.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
                t.employeeDept?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-heading">Meeting Transcripts</h1>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          <Upload size={15} /> Upload New Transcript
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee or department..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted" />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-5 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Employee</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Department</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Duration</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">AI Status</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoadingTranscripts ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-text-muted text-sm">No transcripts found</td></tr>
            ) : filtered.map((t: any) => (
              <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                <td className="px-5 py-3 font-medium">{formatDate(t.date)}</td>
                <td className="px-3 py-3">{t.employeeName}</td>
                <td className="px-3 py-3">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{t.employeeDept}</span>
                </td>
                <td className="px-3 py-3 capitalize">{t.meetingType}</td>
                <td className="px-3 py-3 text-text-muted">{t.duration}</td>
                <td className="px-3 py-3">
                  <span className={cn(
                    'text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
                    t.aiStatus === 'analysed' ? 'bg-success/10 text-success' :
                    t.aiStatus === 'pending' ? 'bg-warning/10 text-warning' : 'bg-text-muted/10 text-text-muted'
                  )}>{t.aiStatus}</span>
                </td>
                <td className="px-3 py-3">
                  <Link href={`/hro/transcripts/${t.id}`} className="text-xs text-primary font-medium hover:text-primary-dark transition-colors">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowUpload(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h2 className="text-lg font-bold font-heading mb-4">Upload Transcript</h2>
            <div className="flex gap-1 bg-surface rounded-lg p-1 mb-4">
              {(['text', 'audio'] as const).map((tab) => (
                <button key={tab} onClick={() => setUploadTab(tab)}
                  className={cn('flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all capitalize',
                    uploadTab === tab ? 'bg-surface-card text-primary shadow-sm' : 'text-text-muted hover:text-foreground'
                  )}>{tab === 'text' ? 'Paste Text' : 'Upload Audio'}</button>
              ))}
            </div>
            {uploadTab === 'text' ? (
              <textarea placeholder="Paste transcript text here..." rows={6}
                value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl p-3 text-sm outline-none focus:border-primary resize-none placeholder:text-text-muted" />
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center">
                <Upload size={24} className="text-text-muted mb-2" />
                <p className="text-sm text-text-muted">Drag & drop audio file or click to browse</p>
                <p className="text-xs text-text-muted mt-1">Supported: .mp3, .wav, .m4a</p>
                <div className="mt-4 p-2 bg-warning/10 text-warning text-xs rounded-lg inline-block w-full">Audio uploads not supported in this demo. Paste text instead!</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none">
                <option value="">Select employee...</option>
                {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
              </select>
              <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} className="h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none">
                <option value="">Meeting type...</option>
                <option value="Check-in">Check-in</option>
                <option value="Performance Review">Performance Review</option>
                <option value="1-on-1">1-on-1</option>
                <option value="Casual">Casual</option>
              </select>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button disabled={uploadMutation.isPending} onClick={() => setShowUpload(false)} className="flex-1 h-10 text-sm font-medium border border-border rounded-lg hover:bg-surface transition-colors">Cancel</button>
              <button disabled={uploadMutation.isPending || !content || !selectedEmployee} onClick={handleUpload} className="flex-1 h-10 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                {uploadMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Upload & Analyse
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
