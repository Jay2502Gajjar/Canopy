'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenLine, Search, Plus, Save, X, Sparkles, Loader2 } from 'lucide-react';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { noteApi, employeeApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ManualNotesPage() {
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const queryClient = useQueryClient();

  const { data: notes = [], isLoading: loadingNotes } = useQuery({ queryKey: ['notes'], queryFn: noteApi.getAll });
  const { data: employees = [], isLoading: loadingEmp } = useQuery({ queryKey: ['employees'], queryFn: employeeApi.getAll });

  const createNoteMutation = useMutation({
    mutationFn: (newNote: any) => noteApi.create(newNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-changes'] });
      setShowEditor(false);
      setNoteContent('');
      setSelectedEmployee('');
    },
  });

  const handleSave = () => {
    if (!selectedEmployee || !noteContent) return;
    createNoteMutation.mutate({
      employeeId: selectedEmployee,
      author: 'Sarah Mitchell', // Hardcoded for demo/HRO
      content: noteContent
    });
  };

  const filtered = notes.filter(
    (n: any) => n.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
                n.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-heading">Manual Notes</h1>
        <button onClick={() => { setShowEditor(true); setSelectedNote(null); setNoteContent(''); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          <Plus size={15} /> New Note
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notes List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedNote(note)}
              className={cn(
                'bg-surface-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all',
                selectedNote?.id === note.id && 'border-primary/40 ring-2 ring-primary/10'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {getInitials(note.employeeName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{note.employeeName}</p>
                    <p className="text-xs text-text-muted">{formatDate(note.date)} · by {note.author}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted mt-2 line-clamp-2">{note.preview}</p>
              {note.aiHighlights && note.aiHighlights.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Sparkles size={11} className="text-primary" />
                  <span className="text-[11px] text-primary font-medium">AI highlighted {note.aiHighlights.length} insights</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Note Detail / Editor */}
        <div className="bg-surface-card border border-border rounded-xl p-5 sticky top-20">
          {(loadingNotes || loadingEmp) && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!loadingNotes && !loadingEmp && showEditor ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold font-heading">New Note</h2>
                <button onClick={() => setShowEditor(false)} className="text-text-muted hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all">
                <option value="">Select employee...</option>
                {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your observations..."
                rows={8}
                className="w-full bg-surface border border-border rounded-xl p-3 text-sm outline-none focus:border-primary resize-none placeholder:text-text-muted"
              />
              <div className="flex gap-2">
                <button className="flex-1 h-9 text-xs font-medium border border-border rounded-lg hover:bg-surface transition-colors" disabled={createNoteMutation.isPending}>Save Draft</button>
                <button onClick={handleSave} disabled={createNoteMutation.isPending || !selectedEmployee || !noteContent} className="flex-1 h-9 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                  {createNoteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Publish
                </button>
              </div>
            </div>
          ) : selectedNote ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {getInitials(selectedNote.employeeName)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{selectedNote.employeeName}</p>
                  <p className="text-xs text-text-muted">{formatDate(selectedNote.date)}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4">{selectedNote.content}</p>
              {selectedNote.meetingContext && (
                <p className="text-xs text-text-muted mb-3">Context: {selectedNote.meetingContext}</p>
              )}
              {selectedNote.aiHighlights && (
                <div className="border-t border-border pt-3 mt-3">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Sparkles size={11} className="text-primary" /> AI Highlights
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedNote.aiHighlights.map((h: any, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              <PenLine size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a note to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
