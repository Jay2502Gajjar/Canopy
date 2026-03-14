'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag, AlertCircle, Target, MessageSquare, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import { mockTranscripts } from '@/lib/mock-data';

export default function TranscriptDetailPage() {
  const params = useParams();
  const transcript = mockTranscripts.find((t) => t.id === params.id) || mockTranscripts[0];
  const analysis = transcript.aiAnalysis;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/hro/transcripts" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface border border-border transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-heading">{transcript.employeeName} — {transcript.meetingType}</h1>
          <p className="text-sm text-text-muted">{formatDate(transcript.date)} · {transcript.duration}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Transcript */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-surface-card border border-border rounded-xl p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <h2 className="text-sm font-semibold font-heading mb-4">Transcript</h2>
          <div className="space-y-4">
            {transcript.content.map((line, i) => (
              <div key={i} className={cn(
                'flex gap-3 p-3 rounded-lg',
                line.isHighlighted && 'bg-warning/[0.06] border-l-[3px] border-l-warning'
              )}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  line.speaker === 'HR Leader' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                )}>
                  {line.speaker === 'HR Leader' ? 'HR' : 'EM'}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{line.speaker}</span>
                  <p className="text-sm mt-0.5 leading-relaxed">{line.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: AI Analysis */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-4">
          {analysis && (
            <>
              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold font-heading mb-3 flex items-center gap-2">
                  <Target size={14} className="text-primary" /> Key Highlights
                </h3>
                <ul className="space-y-2">
                  {analysis.keyHighlights.map((h, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold font-heading mb-2">Sentiment</h3>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-2xl font-bold font-heading',
                    analysis.sentimentScore >= 60 ? 'text-success' :
                    analysis.sentimentScore >= 40 ? 'text-warning' : 'text-danger'
                  )}>
                    {analysis.sentimentScore}
                  </span>
                  <span className="text-sm text-text-muted">/100 — {analysis.sentimentLabel}</span>
                </div>
              </div>

              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold font-heading mb-3 flex items-center gap-2">
                  <Tag size={14} className="text-primary" /> Key Topics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keyTopics.map((t) => (
                    <span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{t}</span>
                  ))}
                </div>
              </div>

              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold font-heading mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-warning" /> Concerns Raised
                </h3>
                <ul className="space-y-1.5">
                  {analysis.concerns.map((c, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-warning mt-1">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold font-heading mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" /> Action Items
                </h3>
                <ul className="space-y-1.5">
                  {analysis.actionItems.map((a, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Add to Profile
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2 px-4 text-sm font-medium bg-surface border border-border rounded-lg hover:bg-surface-card transition-colors">
                  <RefreshCw size={14} /> Re-analyse
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
