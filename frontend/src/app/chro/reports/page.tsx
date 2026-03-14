'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, Calendar, Eye } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const reports = [
  { id: 'r1', title: 'Monthly Workforce Summary', type: 'Monthly', lastGenerated: '2026-03-01', status: 'ready', description: 'Comprehensive overview of workforce metrics, engagement scores, and key HR activities for the month.' },
  { id: 'r2', title: 'Department Engagement Report', type: 'Monthly', lastGenerated: '2026-03-01', status: 'ready', description: 'Engagement scores by department with trend analysis and AI-identified concerns.' },
  { id: 'r3', title: 'Attrition Risk Analysis', type: 'Quarterly', lastGenerated: '2026-01-15', status: 'ready', description: 'AI-powered attrition risk assessment with employee-level predictions and recommended interventions.' },
  { id: 'r4', title: 'HR Activity Report', type: 'Weekly', lastGenerated: '2026-03-10', status: 'ready', description: 'Summary of all HR activities including meetings conducted, transcripts analysed, and commitments tracked.' },
];

export default function ReportsPage() {
  const [previewReport, setPreviewReport] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Executive Reports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileBarChart size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">{report.title}</h3>
                <p className="text-xs text-text-muted mt-1">{report.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] font-semibold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">{report.type}</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar size={10} /> {formatDate(report.lastGenerated)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPreviewReport(report.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                <Eye size={13} /> Preview
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                <Download size={13} /> Download PDF
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold font-heading mb-3">Report Scheduling</h2>
        <p className="text-sm text-text-muted mb-4">Receive auto-generated reports via email on your preferred cadence.</p>
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <span className="text-sm">{r.title}</span>
              <select className="h-8 px-2 rounded-lg bg-surface border border-border text-xs outline-none focus:border-primary cursor-pointer">
                <option>Off</option><option>Weekly</option><option>Monthly</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
