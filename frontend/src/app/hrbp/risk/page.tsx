'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calendar, Shield, Heart } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { mockRiskEmployees } from '@/lib/mock-data';
import { riskIndicatorLabels } from '@/types/risk';

export default function HRBPRiskPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const assignedDepts = ['Engineering', 'Product'];
  const filtered = mockRiskEmployees.filter((r) => assignedDepts.includes(r.department));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading">Risk Analysis — My Departments</h1>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-5 py-3">Employee</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Dept</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Tier</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Indicators</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Days Since</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((risk) => (
              <React.Fragment key={risk.id}>
                <tr onClick={() => setExpandedRow(expandedRow === risk.id ? null : risk.id)}
                  className={cn('hover:bg-surface/50 transition-colors cursor-pointer', risk.riskTier === 'critical' && 'bg-danger/[0.02]')}>
                  <td className="px-5 py-3 font-medium">{risk.name}</td>
                  <td className="px-3 py-3"><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{risk.department}</span></td>
                  <td className="px-3 py-3"><RiskBadge tier={risk.riskTier} /></td>
                  <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{risk.indicators.map((ind) => <span key={ind} className="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded-full text-text-muted">{riskIndicatorLabels[ind]}</span>)}</div></td>
                  <td className="px-3 py-3"><span className={cn('font-semibold', risk.daysSinceInteraction > 60 ? 'text-danger' : risk.daysSinceInteraction > 30 ? 'text-warning' : 'text-foreground')}>{risk.daysSinceInteraction}d</span></td>
                  <td className="px-3 py-3">{expandedRow === risk.id ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}</td>
                </tr>
                <AnimatePresence>
                  {expandedRow === risk.id && (
                    <tr><td colSpan={6}><motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 py-4 bg-surface/30 border-t border-border space-y-4">
                        <div><h4 className="text-xs font-semibold text-text-muted uppercase mb-2">AI Reasoning</h4><p className="text-sm">{risk.aiReasoning}</p></div>
                        <div><h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Suggested Actions</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {risk.suggestedActions.map((a) => (
                              <button key={a.id} className="text-left bg-surface-card border border-border rounded-xl p-3 hover:border-primary/30 transition-all group">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                  {a.type === 'schedule_followup' ? <Calendar size={15} className="text-primary" /> : a.type === 'offer_support' ? <Shield size={15} className="text-primary" /> : <Heart size={15} className="text-primary" />}
                                </div>
                                <p className="text-sm font-semibold group-hover:text-primary">{a.title}</p>
                                <p className="text-xs text-text-muted mt-0.5">{a.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div></td></tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
