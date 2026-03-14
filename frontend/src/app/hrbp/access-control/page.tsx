'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Plus, X, UserPlus } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { AddUserModal } from '@/components/shared/AddUserModal';

const mockUsers = [
  { id: '1', name: 'Jay Gajjar', email: 'sarah@canopy.io', role: 'HRO', departments: ['All'], lastLogin: '2026-03-13', status: 'active' },
  { id: '2', name: 'Vikram Singh', email: 'vikram@canopy.io', role: 'CHRO', departments: ['All'], lastLogin: '2026-03-13', status: 'active' },
  { id: '3', name: 'Priya Sharma', email: 'priya@canopy.io', role: 'HRBP', departments: ['Engineering', 'Product'], lastLogin: '2026-03-12', status: 'active' },
];

const mockAuditLog = [
  { id: 'a1', timestamp: '2026-03-13T16:00:00Z', user: 'Priya Sharma', action: 'Viewed employee profile', data: 'Ananya Patel', ip: '192.168.1.50' },
  { id: 'a2', timestamp: '2026-03-13T10:00:00Z', user: 'AI System', action: 'Sentiment alert', data: 'Engineering dept', ip: 'System' },
];

const tabs = ['Team Users', 'Activity Log', 'Data Access'];

export default function HRBPAccessControlPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Shield size={20} className="text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Access Control</h1>
            <p className="text-sm text-text-muted mt-0.5">Manage team users and permissions</p>
          </div>
        </div>
        <button onClick={() => setIsInviteOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
          <UserPlus size={15} /> Invite User
        </button>
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={cn('flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === i ? 'bg-surface-card text-primary shadow-sm' : 'text-text-muted hover:text-foreground')}>{tab}</button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all placeholder:text-text-muted" />
          </div>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Departments</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {mockUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase())).map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{u.name}</td>
                    <td className="px-3 py-3"><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{u.role}</span></td>
                    <td className="px-3 py-3 text-xs text-text-muted">{u.departments.join(', ')}</td>
                    <td className="px-3 py-3"><span className={cn('text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full', u.status === 'active' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted')}>{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-5 py-3">Time</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">User</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Action</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Data</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {mockAuditLog.map((log) => (
                <tr key={log.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3 text-text-muted text-xs">{formatDate(log.timestamp)}</td>
                  <td className="px-3 py-3 font-medium">{log.user}</td>
                  <td className="px-3 py-3">{log.action}</td>
                  <td className="px-3 py-3 text-text-muted">{log.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold font-heading mb-4">Data Access Permissions</h3>
          <div className="space-y-3">
            {['Employee Profiles', 'Transcripts', 'Risk Scores', 'Notes', 'Department Analytics'].map((perm, i) => (
              <div key={perm} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="text-sm font-medium">{perm}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={i < 4} className="sr-only peer" />
                  <div className="w-10 h-5 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite User Modal (#1) */}
      <AddUserModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite User" defaultRole="HRO" />
    </div>
  );
}
