'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FileText, Settings, Search, Plus, X } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const mockUsers = [
  { id: '1', name: 'Jay Gajjar', email: 'jaygajjar2502@gmail.com', role: 'HRO', departments: ['All'], lastLogin: '2026-03-13', status: 'active' },
  { id: '2', name: 'Vikram Singh', email: 'vikram@canopy.io', role: 'CHRO', departments: ['All'], lastLogin: '2026-03-13', status: 'active' },
  { id: '3', name: 'Priya Sharma', email: 'priya@canopy.io', role: 'HRBP', departments: ['Engineering', 'Product'], lastLogin: '2026-03-12', status: 'active' },
  { id: '4', name: 'Arjun Rao', email: 'arjun.rao@canopy.io', role: 'HRBP', departments: ['Design'], lastLogin: '2026-03-10', status: 'active' },
  { id: '5', name: 'Kavitha Das', email: 'kavitha.das@canopy.io', role: 'HRBP', departments: ['Sales', 'Operations'], lastLogin: '2026-03-11', status: 'disabled' },
];

const mockAuditLog = [
  { id: 'a1', timestamp: '2026-03-13T16:00:00Z', user: 'Jay Gajjar', action: 'Viewed employee profile', data: 'Deepak Verma', ip: '192.168.1.45' },
  { id: 'a2', timestamp: '2026-03-13T14:30:00Z', user: 'AI System', action: 'Generated risk flag', data: 'Engineering dept', ip: 'System' },
  { id: 'a3', timestamp: '2026-03-13T10:00:00Z', user: 'Jay Gajjar', action: 'Approved leave', data: 'Meera Nair', ip: '192.168.1.45' },
];

const tabs = ['Users', 'Audit Log', 'Consent Management'];

export default function AccessControlPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<typeof mockUsers[0] | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-heading">Access Control</h1>
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={cn('flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === i ? 'bg-surface-card text-primary shadow-sm' : 'text-text-muted hover:text-foreground'
            )}>{tab}</button>
        ))}
      </div>

      {activeTab === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all placeholder:text-text-muted" />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
              <Plus size={15} /> Invite User
            </button>
          </div>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Departments</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Status</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase())).map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{u.name}</td>
                    <td className="px-3 py-3 text-text-muted">{u.email}</td>
                    <td className="px-3 py-3"><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{u.role}</span></td>
                    <td className="px-3 py-3 text-xs text-text-muted">{u.departments.join(', ')}</td>
                    <td className="px-3 py-3">
                      <span className={cn('text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
                        u.status === 'active' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'
                      )}>{u.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => setEditUser(u)} className="text-xs text-primary font-medium hover:text-primary-dark">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-surface-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-5 py-3">Timestamp</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">User</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Action</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">Data</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-3 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockAuditLog.map((log) => (
                <tr key={log.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3 text-text-muted text-xs">{formatDate(log.timestamp)}</td>
                  <td className="px-3 py-3 font-medium">{log.user}</td>
                  <td className="px-3 py-3">{log.action}</td>
                  <td className="px-3 py-3 text-text-muted">{log.data}</td>
                  <td className="px-3 py-3 text-text-muted font-mono text-xs">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {activeTab === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-surface-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold font-heading mb-4">AI Transcript Analysis Consent</h3>
          <div className="space-y-3">
            {['Rahul Kumar', 'Ananya Patel', 'Deepak Verma', 'Meera Nair', 'Arjun Menon'].map((name, i) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="text-sm font-medium">{name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={i !== 2} className="sr-only peer" />
                  <div className="w-10 h-5 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditUser(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading">Edit User</h2>
              <button onClick={() => setEditUser(null)}><X size={18} className="text-text-muted" /></button>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Name</label>
              <input defaultValue={editUser.name} className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Role</label>
              <select defaultValue={editUser.role} className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary">
                <option>HRO</option><option>CHRO</option><option>HRBP</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditUser(null)} className="flex-1 h-10 text-sm font-medium border border-border rounded-lg hover:bg-surface">Cancel</button>
              <button onClick={() => setEditUser(null)} className="flex-1 h-10 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark">Save</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
