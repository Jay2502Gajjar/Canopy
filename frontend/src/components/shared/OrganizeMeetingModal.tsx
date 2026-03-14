'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Loader2, Sparkles } from 'lucide-react';
import { meetingApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface OrganizeMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
}

const meetingTypes = [
  { value: 'check-in', label: 'Check-in' },
  { value: '1-on-1', label: '1-on-1' },
  { value: 'performance', label: 'Performance Review' },
  { value: 'casual', label: 'Casual' },
];

export function OrganizeMeetingModal({ isOpen, onClose, employeeId, employeeName, employeeDept }: OrganizeMeetingModalProps) {
  const [meetingType, setMeetingType] = useState('check-in');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('30 min');
  const [prepData, setPrepData] = useState<any>(null);
  const [isPrepping, setIsPrepping] = useState(false);
  const [prepError, setPrepError] = useState('');
  const queryClient = useQueryClient();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setPrepData(null);
      setPrepError('');
      setIsPrepping(false);
      setDate('');
      setMeetingType('check-in');
    }
  }, [isOpen]);

  const fetchPrep = async () => {
    setIsPrepping(true);
    setPrepError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/ai/meeting-prep/${employeeId}`);
      setPrepData(res.data);
    } catch (err: any) {
      setPrepError("Failed to generate meeting prep. Please try again later.");
    } finally {
      setIsPrepping(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: any) => meetingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['recent-changes'] });
      // Instead of closing, fetch the prep!
      fetchPrep();
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || mutation.isPending) return;
    mutation.mutate({
      employeeId,
      employeeName,
      employeeDept,
      meetingType,
      date,
      time,
      duration,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-surface-card border border-border shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface/50">
          <div>
            <h2 className="text-lg font-bold font-heading flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Schedule Meeting
            </h2>
            <p className="text-xs text-text-muted mt-0.5">With {employeeName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors bg-surface hover:bg-border p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {!prepData && !isPrepping && !prepError && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Meeting Type</label>
              <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all">
                {meetingTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Duration</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all">
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="1 hour">1 hour</option>
                </select>
              </div>
            </div>

            {mutation.isError && (
              <p className="text-sm text-danger">Failed to schedule meeting. Please try again.</p>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 h-10 text-sm font-medium border border-border bg-surface-card rounded-lg hover:bg-surface transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!date || mutation.isPending}
                className="flex-1 h-10 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Schedule & Prep
              </button>
            </div>
          </form>
        )}

        {(isPrepping || prepData || prepError) && (
          <div className="p-5">
            {isPrepping ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm text-text-muted">Analyzing history and generating prep brief...</p>
              </div>
            ) : prepError ? (
              <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl text-center">
                <p className="text-sm text-danger mb-4">{prepError}</p>
                <button onClick={onClose} className="px-4 py-2 bg-surface text-sm font-medium rounded-lg hover:bg-border transition-colors">Close</button>
              </div>
            ) : prepData && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary mb-3">
                    <Sparkles size={16} /> AI Meeting Brief
                  </h3>
                  {prepData.brief && (
                    <p className="text-sm text-foreground/80 mb-3 italic">{prepData.brief}</p>
                  )}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-text-muted uppercase mb-1">Key Context</h4>
                      <ul className="text-sm space-y-1">
                        {prepData.keyContext?.length > 0 ? prepData.keyContext.map((c: string, i: number) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-foreground/90">{c}</span>
                          </li>
                        )) : (
                          <li className="text-text-muted text-xs">No context available yet</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-muted uppercase mb-1 mt-3">Suggested Topics</h4>
                      <ul className="text-sm space-y-1">
                        {prepData.suggestedTopics?.length > 0 ? prepData.suggestedTopics.map((t: string, i: number) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-foreground/90">{t}</span>
                          </li>
                        )) : (
                          <li className="text-text-muted text-xs">No topics available yet</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                   <button onClick={onClose} className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                     Done
                   </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
