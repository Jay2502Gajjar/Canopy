'use client';

import React, { useState } from 'react';
import { BarChart2, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockDepartments } from '@/lib/mock-data';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const sentimentTrend = [
  { month: 'Oct', Engineering: 58, Product: 78, Sales: 60, Design: 72, Marketing: 70 },
  { month: 'Nov', Engineering: 55, Product: 80, Sales: 57, Design: 70, Marketing: 72 },
  { month: 'Dec', Engineering: 52, Product: 79, Sales: 55, Design: 68, Marketing: 73 },
  { month: 'Jan', Engineering: 50, Product: 82, Sales: 52, Design: 66, Marketing: 74 },
  { month: 'Feb', Engineering: 48, Product: 81, Sales: 50, Design: 68, Marketing: 74 },
];

const attritionTrend = [
  { month: 'Sep', count: 3 }, { month: 'Oct', count: 3 },
  { month: 'Nov', count: 5 }, { month: 'Dec', count: 4 },
  { month: 'Jan', count: 4 }, { month: 'Feb', count: 5 },
];

const riskHeatmap = [
  { dept: 'Engineering', negative: 3, burnout: 4, engagement: 2 },
  { dept: 'Sales', negative: 2, burnout: 1, engagement: 3 },
  { dept: 'Design', negative: 1, burnout: 0, engagement: 1 },
  { dept: 'Product', negative: 0, burnout: 0, engagement: 0 },
  { dept: 'Marketing', negative: 0, burnout: 0, engagement: 1 },
  { dept: 'Finance', negative: 1, burnout: 0, engagement: 2 },
];

const deptColors = ['#0F766E', '#0EA5E9', '#D97706', '#9333EA', '#22C55E'];

const tabs = [
  { id: 'sentiment', label: 'Sentiment Trends', icon: TrendingUp },
  { id: 'engagement', label: 'Engagement', icon: BarChart2 },
  { id: 'risk', label: 'Risk Heatmap', icon: AlertTriangle },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('sentiment');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Workforce Analytics</h1>
      </div>

      {/* Summary cards — quick glance before diving into tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Sentiment', value: '64', sub: '/100', color: 'text-primary' },
          { label: 'At-Risk Depts', value: '2', sub: 'of 7', color: 'text-warning' },
          { label: 'Attrition (6mo)', value: '24', sub: 'employees', color: 'text-danger' },
          { label: 'Top Dept', value: 'Product', sub: '82 score', color: 'text-success' },
        ].map((c) => (
          <div key={c.label} className="bg-surface-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
            <p className="text-xs text-text-muted uppercase tracking-wide">{c.label}</p>
            <p className={cn('text-2xl font-bold font-heading', c.color)}>{c.value}</p>
            <p className="text-xs text-text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-card')}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'sentiment' && (
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold font-heading mb-1">Department Sentiment Over Time</h2>
          <p className="text-xs text-text-muted mb-4">Tracking sentiment scores across departments</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={sentimentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis domain={[30, 90]} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
              {['Engineering', 'Product', 'Sales', 'Design', 'Marketing'].map((dept, i) => (
                <Line key={dept} type="monotone" dataKey={dept} stroke={deptColors[i]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-3 justify-center">
            {['Engineering', 'Product', 'Sales', 'Design', 'Marketing'].map((dept, i) => (
              <div key={dept} className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full" style={{ backgroundColor: deptColors[i] }} />
                <span className="text-xs text-text-muted">{dept}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold font-heading mb-4">Engagement by Department</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockDepartments}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="engagementScore" radius={[4, 4, 0, 0]}>
                  {mockDepartments.map((dept, i) => (
                    <Cell key={i} fill={dept.engagementScore >= 75 ? '#22C55E' : dept.engagementScore >= 50 ? '#D97706' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-surface-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold font-heading mb-4">Attrition Trend (6 months)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attritionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="bg-surface-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold font-heading mb-1">Workforce Risk Heatmap</h2>
          <p className="text-xs text-text-muted mb-4">Number of risk indicators by department</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase px-3 py-2">Department</th>
                  <th className="text-center text-xs font-semibold text-text-muted uppercase px-3 py-2">Negative Sentiment</th>
                  <th className="text-center text-xs font-semibold text-text-muted uppercase px-3 py-2">Burnout</th>
                  <th className="text-center text-xs font-semibold text-text-muted uppercase px-3 py-2">Low Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {riskHeatmap.map((row) => (
                  <tr key={row.dept} className="hover:bg-surface/50 transition-colors">
                    <td className="px-3 py-2.5 font-medium">{row.dept}</td>
                    {[row.negative, row.burnout, row.engagement].map((val, i) => (
                      <td key={i} className="px-3 py-2.5 text-center">
                        <span className={cn(
                          'inline-flex w-8 h-8 rounded-lg items-center justify-center text-xs font-bold',
                          val === 0 ? 'bg-surface text-text-muted' : val <= 1 ? 'bg-warning/10 text-warning' :
                          val <= 2 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                        )}>{val}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
