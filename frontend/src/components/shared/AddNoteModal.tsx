'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, PenLine, Loader2 } from 'lucide-react';
import { noteApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
  employeeName: string;
}

export function AddNoteModal({ isOpen, onClose, employeeId, employeeName }: AddNoteModalProps) {
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const noteMutation = useMutation({
    mutationFn: (data: any) => noteApi.create(data),
    onSuccess: () => {
      setNote('');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-changes'] });
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || noteMutation.isPending) return;

    noteMutation.mutate({
      employeeId: employeeId,
      employeeName: employeeName,
      author: 'HR Manager', // Placeholder for current user
      content: note,
      preview: note.substring(0, 100) + (note.length > 100 ? '...' : ''),
      date: new Date().toISOString(),
      meetingContext: 'Manual Note'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-surface-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold font-heading flex items-center gap-2">
              <PenLine size={18} className="text-primary" /> Add HR Note
            </h2>
            <p className="text-xs text-text-muted mt-0.5">For {employeeName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors bg-surface hover:bg-border p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 flex-1 min-h-[200px] flex flex-col">
            <textarea
              autoFocus
              className="w-full h-full flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-text-muted/60 leading-relaxed"
              placeholder="Write your note here... (Markdown is supported)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="p-4 flex items-center justify-between border-t border-border bg-surface/50 flex-shrink-0">
            <span className="text-xs text-text-muted">Draft saved automatically.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium border border-border bg-surface-card rounded-lg hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!note.trim() || noteMutation.isPending}
                className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {noteMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Save Note
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
