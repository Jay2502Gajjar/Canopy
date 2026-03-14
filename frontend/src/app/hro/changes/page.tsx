'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Award, UserPlus, RefreshCw, LogOut, FileText, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { recentChangesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { StaggerContainer } from '@/components/shared/FadeInOnScroll';

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
      <StaggerContainer className="space-y-3" direction="left" staggerMs={40}>
        {activities.length === 0 ? (
          <p className="text-sm text-text-muted mt-4">No recent changes found.</p>
        ) : activities.map((activity: any) => {
          const Icon = typeIcons[activity.eventType] || FileText;
          return (
            <div
              key={activity.id}
              className="bg-surface-card border border-border rounded-xl p-4 flex items-start gap-4"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', typeColors[activity.eventType] || 'bg-primary/10 text-primary')}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{activity.employeeName} <span className="font-normal text-text-muted ml-1">{activity.description}</span></p>
                <p className="text-xs text-text-muted mt-1 flex items-center gap-2">
                  <span>{formatRelativeTime(activity.timestamp)}</span>
                  {activity.metadata?.oldRole && activity.metadata?.newRole && (
                    <span>· {activity.metadata.oldRole} → {activity.metadata.newRole}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
