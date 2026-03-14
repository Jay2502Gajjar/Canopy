'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, XCircle, Filter, Loader2, ArrowRight, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface Candidate {
  id: string;
  filename: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  atsScore: number;
  missingSkills?: string[];
  matchedSkills?: string[];
}

const ALL_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 
  'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'FastAPI',
  'Java', 'C++', 'Go', 'GraphQL', 'MongoDB'
];

const demoCandidates: Candidate[] = [
  {
    id: 'demo-1', filename: 'alex_chen_resume.pdf', name: 'Alex Chen', email: 'alex.chen@example.com', phone: '555-0101',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL'], experience: '5 years full-stack development. Led migration to microservices.', education: 'B.S. Computer Science, UC Berkeley', atsScore: 88
  },
  {
    id: 'demo-2', filename: 'sarah_jenkins_cv.pdf', name: 'Sarah Jenkins', email: 's.jenkins@example.com', phone: '555-0102',
    skills: ['Python', 'FastAPI', 'Docker', 'AWS', 'PostgreSQL'], experience: '4 years backend engineering. Optimized database queries improving performance by 40%.', education: 'M.S. Software Engineering, MIT', atsScore: 92
  },
  {
    id: 'demo-3', filename: 'michael_rodriguez.pdf', name: 'Michael Rodriguez', email: 'mrod@example.com', phone: '555-0103',
    skills: ['Java', 'React', 'MongoDB', 'Docker'], experience: '3 years as software developer. Built interior dashboard for sales team.', education: 'B.S. Information Technology, UT Austin', atsScore: 75
  },
  {
    id: 'demo-4', filename: 'emily_wang.pdf', name: 'Emily Wang', email: 'ewang@example.com', phone: '555-0104',
    skills: ['Machine Learning', 'Python', 'Go', 'Kubernetes', 'AWS'], experience: '6 years ML engineer. Deployed recommendation models serving 1M+ users.', education: 'Ph.D. Computer Science, Stanford', atsScore: 95
  }
];

export default function AtsPipelinePage() {
  const { initTheme } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  // Filtering state
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [accepted, setAccepted] = useState<Candidate[]>([]);
  const [rejected, setRejected] = useState<Candidate[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { initTheme(); }, [initTheme]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      const pdfs = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      setFiles(prev => [...prev, ...pdfs]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const pdfs = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      setFiles(prev => [...prev, ...pdfs]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const processResumes = async () => {
    if (!files.length) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/ats/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCandidates(data.candidates || []);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to process resumes');
    } finally {
      setIsUploading(false);
    }
  };

  const filterCandidates = async () => {
    setIsFiltering(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/ats/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates, requiredSkills }),
      });
      
      if (!res.ok) throw new Error('Filtering failed');
      const data = await res.json();
      setAccepted(data.accepted || []);
      setRejected(data.rejected || []);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to filter candidates');
    } finally {
      setIsFiltering(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">ATS Resume Pipeline</h1>
          <p className="text-sm text-text-muted mt-1">AI-powered 3-step resume screening and filtering system</p>
        </div>
      </div>

      {/* Progress Wizard */}
      <div className="bg-surface-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: step === 1 ? '16%' : step === 2 ? '50%' : '100%' }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          
          {[
            { num: 1, label: 'Upload', icon: Upload },
            { num: 2, label: 'Process', icon: Loader2 },
            { num: 3, label: 'Filter', icon: Filter }
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 bg-surface-card px-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300",
                step > s.num ? "bg-primary text-white" : step === s.num ? "bg-primary text-white ring-4 ring-primary/20" : "bg-surface border border-border text-text-muted"
              )}>
                {step > s.num ? <Check size={18} /> : <span>{s.num}</span>}
              </div>
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                step >= s.num ? "text-primary" : "text-text-muted"
              )}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="space-y-6">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={cn(
                  "border-2 border-dashed border-border rounded-2xl p-12 text-center bg-surface-card hover:bg-surface transition-colors cursor-pointer flex flex-col items-center justify-center gap-4",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="application/pdf" onChange={handleFileSelect} />
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Upload size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Drag & drop resumes here</h3>
                  <p className="text-sm text-text-muted mt-1">Support PDF files only. You can select multiple files.</p>
                </div>
                <button className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                  Browse Files
                </button>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">OR Try Demo</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <div className="text-center">
                 <button 
                  onClick={() => { setCandidates(demoCandidates); setStep(2); }}
                  className="px-6 py-2.5 border border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary/10 transition-colors"
                >
                  Load Sample Resumes
                </button>
              </div>

              {files.length > 0 && (
                <div className="bg-surface-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold font-heading">Selected Files ({files.length})</h3>
                    <button 
                      onClick={processResumes}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                    >
                      {isUploading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <>Process Resumes <ArrowRight size={16} /></>}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-surface">
                        <FileText size={18} className="text-primary opacity-70" />
                        <span className="flex-1 text-sm truncate">{f.name}</span>
                        <button onClick={() => removeFile(i)} className="text-text-muted hover:text-danger"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROCESS & SELECT SKILLS */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Candidates List */}
                <div className="lg:col-span-3 space-y-4">
                  <h3 className="text-sm font-semibold font-heading flex items-center gap-2">
                     Parsed Candidates ({candidates.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidates.map((c) => (
                      <div key={c.id} className="bg-surface-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{c.name}</h4>
                            <p className="text-xs text-text-muted">{c.email} | {c.phone}</p>
                          </div>
                          <div className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold flex flex-col items-center">
                            <span>Score</span>
                            <span className="text-lg">{c.atsScore}</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-text-muted uppercase mb-1.5">Skills Extracted</p>
                          <div className="flex flex-wrap gap-1.5">
                            {c.skills.map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-surface border border-border rounded-md text-[10px] font-medium">
                                {s}
                              </span>
                            ))}
                            {c.skills.length === 0 && <span className="text-xs text-text-muted italic">No skills found</span>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase mb-1.5">Experience</p>
                          <p className="text-xs text-foreground line-clamp-2">{c.experience || 'Not detected'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Filter Sidebar */}
                <div className="bg-surface-card border border-border rounded-xl p-5 h-fit sticky top-6">
                  <h3 className="text-sm font-semibold font-heading mb-4 pb-3 border-b border-border flex items-center gap-2">
                    <Filter size={16} className="text-primary" /> Required Skills
                  </h3>
                  <p className="text-xs text-text-muted mb-4">Select the mandatory skills for this role. Candidates missing EVEN ONE skill will be rejected.</p>
                  
                  <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {ALL_SKILLS.map(skill => {
                      const isSelected = requiredSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all text-left",
                            isSelected ? "bg-primary/5 border-primary text-primary font-medium" : "bg-surface border-border text-foreground hover:border-primary/30"
                          )}
                        >
                          {skill}
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={filterCandidates}
                    disabled={isFiltering || requiredSkills.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {isFiltering ? <Loader2 size={16} className="animate-spin" /> : 'Run ATS Filter'}
                  </button>
                  {requiredSkills.length === 0 && (
                    <p className="text-center text-[10px] text-danger mt-2">Select at least one skill</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex gap-3 mb-6">
                <button onClick={() => setStep(2)} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-surface">
                  Back to Filters
                </button>
                <div className="flex gap-2">
                  {requiredSkills.map(s => (
                    <span key={s} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20">{s}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* ACCEPTED COLUMN */}
                <div className="bg-surface-card border border-success/30 rounded-xl p-5 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                    <h3 className="text-lg font-bold font-heading flex items-center gap-2 text-success">
                      <CheckCircle2 size={20} /> Accepted candidates
                    </h3>
                    <span className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">
                      {accepted.length}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {accepted.length === 0 ? (
                      <div className="text-center py-10 opacity-60">
                        <XCircle size={32} className="mx-auto mb-3 text-text-muted" />
                        <p className="text-sm">No candidates matched all requirements.</p>
                      </div>
                    ) : (
                      accepted.map(c => (
                        <div key={c.id} className="p-4 border border-success/20 bg-success/5 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold">{c.name}</h4>
                            <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">Score: {c.atsScore}</span>
                          </div>
                          <p className="text-xs text-text-muted mb-3">{c.email}</p>
                          <div className="flex flex-wrap gap-1">
                            {c.matchedSkills?.map(s => (
                              <span key={s} className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[10px] font-medium flex items-center gap-1">
                                <Check size={10} /> {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* REJECTED COLUMN */}
                <div className="bg-surface-card border border-danger/30 rounded-xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                    <h3 className="text-lg font-bold font-heading flex items-center gap-2 text-danger">
                      <XCircle size={20} /> Rejected candidates
                    </h3>
                    <span className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center font-bold">
                      {rejected.length}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {rejected.length === 0 ? (
                      <div className="text-center py-10 opacity-60">
                        <CheckCircle2 size={32} className="mx-auto mb-3 text-text-muted" />
                        <p className="text-sm">No candidates were rejected.</p>
                      </div>
                    ) : (
                      rejected.map(c => (
                        <div key={c.id} className="p-4 border border-danger/20 bg-danger/5 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold opacity-80">{c.name}</h4>
                            <span className="text-xs font-bold text-text-muted bg-surface border border-border px-2 py-1 rounded">Score: {c.atsScore}</span>
                          </div>
                          <p className="text-xs text-text-muted mb-3">{c.email}</p>
                          <div>
                            <p className="text-[10px] font-semibold text-danger uppercase mb-1">Missing Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {c.missingSkills?.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded text-[10px] font-medium flex items-center gap-1">
                                  <X size={10} /> {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
