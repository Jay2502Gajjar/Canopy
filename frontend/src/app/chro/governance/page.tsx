'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { mockDepartments } from '@/lib/mock-data';

const hrbpData = [
  { name: 'Priya Sharma', departments: ['Engineering', 'Product'], meetings30d: 14, avgEmployees: 4.2, lastMeeting: 'Mar 12' },
  { name: 'Vikram Singh', departments: ['Marketing'], meetings30d: 5, avgEmployees: 3.1, lastMeeting: 'Mar 10' },
  { name: 'Arjun Rao', departments: ['Design'], meetings30d: 4, avgEmployees: 2.5, lastMeeting: 'Mar 8' },
  { name: 'Kavitha Das', departments: ['Sales', 'Operations'], meetings30d: 7, avgEmployees: 3.8, lastMeeting: 'Mar 11' },
];

export default function GovernancePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading">HR Governance</h1>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold font-heading mb-4">HRBP Meeting Coverage</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase px-4 py-3">HRBP</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Departments</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Meetings (30d)</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Avg / Meeting</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Last Meeting</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hrbpData.map((h) => (
                <tr key={h.name} className={cn('hover:bg-surface/50', h.meetings30d < 4 && 'bg-warning/[0.03]')}>
                  <td className="px-4 py-3 font-medium">{h.name}</td>
                  <td className="px-3 py-3 text-text-muted">{h.departments.join(', ')}</td>
                  <td className="px-3 py-3 font-semibold">{h.meetings30d}</td>
                  <td className="px-3 py-3 text-text-muted">{h.avgEmployees}</td>
                  <td className="px-3 py-3 text-text-muted">{h.lastMeeting}</td>
                  <td className="px-3 py-3">
                    <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                      h.meetings30d >= 8 ? 'bg-success/10 text-success' :
                      h.meetings30d >= 4 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                    )}>{h.meetings30d >= 8 ? 'Active' : h.meetings30d >= 4 ? 'Moderate' : 'Low'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold font-heading mb-4">HR Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hrbpData.map((h) => (
            <div key={h.name} className="bg-surface border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">{h.name}</h3>
              <div className="space-y-2">
                {[
                  ['Meeting frequency', `${h.meetings30d}/month`],
                  ['Commitment resolution', '78%'],
                  ['Transcript uploads', `${Math.floor(h.meetings30d * 0.8)}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
