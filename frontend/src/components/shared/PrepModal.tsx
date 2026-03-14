'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, TrendingUp, FileText, Sparkles, Loader2 } from 'lucide-react';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { employeeApi, aiApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface PrepModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PrepModal({ employeeId, isOpen, onClose }: PrepModalProps) {
  const { data: employee, isLoading: isLoadingEmp } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeApi.getById(employeeId),
    enabled: isOpen,
  });

  const { data: prepData, isLoading: isLoadingPrep, error: prepError } = useQuery({
    queryKey: ['meeting-prep', employeeId],
    queryFn: () => aiApi.getMeetingPrep(employeeId),
    enabled: isOpen && !!employee,
    retry: 2,
  });

  if (!isOpen) return null;
  
  const isLoading = isLoadingEmp || isLoadingPrep;
  const brief = prepData?.brief;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            
            {/* Header */}
            <div className="sticky top-0 bg-surface-card border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-primary" />
                <h2 className="text-lg font-bold font-heading">Meeting Prep</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface transition-colors">
                <X size={16} className="text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-text-muted animate-pulse">AI is preparing your meeting brief...</p>
                </div>
              ) : !employee ? (
                <div className="text-center py-10">
                  <p className="text-sm text-text-muted">Employee data not found.</p>
                </div>
              ) : (
                <>
                  {/* Employee Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                      {getInitials(employee.name)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{employee.name}</h3>
                      <p className="text-sm text-text-muted">{employee.role} · {employee.department}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <RiskBadge tier={employee.riskTier} />
                        <span className="text-xs text-text-muted">Sentiment: {employee.sentimentScore}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Generated Brief */}
                  {brief ? (
                    <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Sparkles size={14} /> AI Generated Strategy
                      </h4>
                      <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
                        {brief}
                      </div>
                    </div>
                  ) : prepError ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-warning/5 border border-warning/10 rounded-xl flex items-start gap-2">
                        <AlertCircle size={14} className="text-warning mt-0.5" />
                        <p className="text-xs text-text-muted">AI brief unavailable. Showing profile-based summary instead.</p>
                      </div>
                      <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Sparkles size={14} /> Auto-Generated Talking Points
                        </h4>
                        <div className="space-y-2 text-sm">
                          {employee.concerns && employee.concerns.length > 0 && (
                            <p>• Follow up on concern: "{employee.concerns[0]?.text}"</p>
                          )}
                          {employee.careerAspirations && employee.careerAspirations.length > 0 && (
                            <p>• Discuss career goal: {employee.careerAspirations[0]}</p>
                          )}
                          <p>• Review current workload and team dynamics</p>
                          <p>• Check in on overall wellbeing and engagement</p>
                          <p>• Discuss upcoming projects and skill development</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Key Concerns */}
                  {employee.concerns && employee.concerns.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-warning" /> Historical Concerns
                      </h4>
                      <div className="space-y-2">
                        {employee.concerns.map((c: any, i: number) => (
                          <div key={i} className="text-sm p-2.5 rounded-lg bg-warning/[0.05] border-l-[3px] border-l-warning">
                            <p>{c.text}</p>
                            <p className="text-xs text-text-muted mt-1">{c.meetingRef} · {formatDate(c.date)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Aspirations */}
                  {employee.careerAspirations && employee.careerAspirations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-primary" /> Career Goals
                      </h4>
                      <ul className="space-y-1">
                        {employee.careerAspirations.map((a: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary">•</span> {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
