'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Star, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const hiringForecasts = [
  { dept: 'Engineering', need: 8, reason: 'Platform Rebuild staffing + attrition backfill', urgency: 'high' },
  { dept: 'Sales', need: 3, reason: 'Replace departures + expand APAC channel', urgency: 'high' },
  { dept: 'Product', need: 2, reason: 'Mobile app v2 initiative', urgency: 'medium' },
  { dept: 'Design', need: 1, reason: 'Design system scale-up', urgency: 'low' },
];

const demandTrends = [
  { role: 'Senior Engineers', trend: 'up', signal: 'Mentioned in 12 transcripts this quarter' },
  { role: 'Data Scientists', trend: 'up', signal: 'Requested in 3 dept planning sessions' },
  { role: 'QA Engineers', trend: 'up', signal: 'Capacity gaps flagged by Deepak Verma' },
  { role: 'Marketing Analysts', trend: 'down', signal: 'Tooling automation reducing need' },
];

const leadershipGaps = [
  { name: 'Rahul Kumar', potential: 'High', risk: 'Concern', suggestion: 'Fast-track management training, assign mentoring role' },
  { name: 'Arjun Menon', potential: 'High', risk: 'Concern', suggestion: 'Leadership development program, VP Sales path clarity' },
  { name: 'Nisha Reddy', potential: 'Medium', risk: 'Stable', suggestion: 'Cross-functional project exposure' },
];

export default function PlanningPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading">Strategic Workforce Planning</h1>

      {/* Hiring Forecasts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold font-heading mb-4 flex items-center gap-2">
          <Users size={15} className="text-primary" /> AI Hiring Forecasts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hiringForecasts.map((f) => (
            <div key={f.dept} className={cn(
              'p-4 rounded-xl border border-border',
              f.urgency === 'high' ? 'border-l-[3px] border-l-danger' :
              f.urgency === 'medium' ? 'border-l-[3px] border-l-warning' : 'border-l-[3px] border-l-success'
            )}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold">{f.dept}</h3>
                <span className="text-lg font-bold text-primary">+{f.need}</span>
              </div>
              <p className="text-xs text-text-muted">{f.reason}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Demand Trends */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold font-heading mb-4">Workforce Demand Trends</h2>
        <div className="space-y-3">
          {demandTrends.map((d) => (
            <div key={d.role} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors">
              {d.trend === 'up' ? (
                <TrendingUp size={16} className="text-success flex-shrink-0" />
              ) : (
                <TrendingDown size={16} className="text-danger flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{d.role}</p>
                <p className="text-xs text-text-muted">{d.signal}</p>
              </div>
              <span className={cn(
                'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                d.trend === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              )}>
                {d.trend === 'up' ? 'Rising' : 'Declining'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Leadership Gaps */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold font-heading mb-4 flex items-center gap-2">
          <Star size={15} className="text-primary" /> Leadership Gap Detection
        </h2>
        <div className="space-y-3">
          {leadershipGaps.map((g) => (
            <div key={g.name} className="p-4 rounded-xl border border-border bg-surface/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{g.name}</span>
                <div className="flex gap-2">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">Potential: {g.potential}</span>
                  <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                    g.risk === 'Concern' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  )}>Risk: {g.risk}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lightbulb size={13} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-muted">{g.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
