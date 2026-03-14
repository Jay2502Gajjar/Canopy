'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, UserPlus } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { AddUserModal } from '@/components/shared/AddUserModal';

const mockAuditLog = [
  { id: 'a1', timestamp: '2026-03-13T16:00:00Z', user: 'Sarah Mitchell', action: 'Viewed employee profile', data: 'Deepak Verma', ip: '192.168.1.45' },
  { id: 'a2', timestamp: '2026-03-13T14:30:00Z', user: 'AI System', action: 'Generated risk flag', data: 'Engineering dept', ip: 'System' },
  { id: 'a3', timestamp: '2026-03-13T10:00:00Z', user: 'Sarah Mitchell', action: 'Approved leave', data: 'Meera Nair', ip: '192.168.1.45' },
];

export default function CHROAccessControlPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Shield size={20} className="text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Access & Audit</h1>
            <p className="text-sm text-text-muted mt-0.5">Monitor system access and activity</p>
          </div>
        </div>
        <button onClick={() => setIsInviteOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
          <UserPlus size={15} /> Invite User
        </button>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border"><h2 className="text-sm font-semibold font-heading">Audit Log</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-text-muted uppercase px-5 py-3">Timestamp</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">User</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Action</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Data</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">IP</th>
          </tr></thead>
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

      {/* Invite User Modal (#1) */}
      <AddUserModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite User" defaultRole="HRBP" />
    </div>
  );
}
