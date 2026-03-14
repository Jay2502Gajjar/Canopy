'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Award, UserPlus, RefreshCw, LogOut, FileText, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { recentChangesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const typeIcons: Record<string, React.ElementType> = {
  leave_approval: FileText,
  promotion: Award,
  role_change: RefreshCw,
  profile_update: Briefcase,
  new_hire: UserPlus,
  resignation_flagged: LogOut,
};
const typeColors: Record<string, string> = {
  leave_approval: 'bg-secondary/10 text-secondary',
  promotion: 'bg-success/10 text-success',
  role_change: 'bg-primary/10 text-primary',
  profile_update: 'bg-primary/10 text-primary',
  new_hire: 'bg-success/10 text-success',
  resignation_flagged: 'bg-danger/10 text-danger',
};

export default function RecentChangesPage() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recent-changes'],
    queryFn: () => recentChangesApi.getAll(30),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading">Recent Changes</h1>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-text-muted mt-4">No recent changes found.</p>
        ) : activities.map((activity: any, i: number) => {
          const Icon = typeIcons[activity.eventType] || FileText;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface-card border border-border rounded-xl p-4 flex items-start gap-4"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', typeColors[activity.eventType] || 'bg-primary/10 text-primary')}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {activity.employeeName && <span className="font-semibold">{activity.employeeName} — </span>}
                  {activity.description}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {formatRelativeTime(activity.timestamp)}
                  {activity.employeeName ? '' : ' · System Event'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
