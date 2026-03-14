'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Bot, Monitor, Bell, Check, Sparkles } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const sourceIcons = { email: Mail, ai: Bot, system: Monitor };

// Mock mail summary data (#3)
const mailSummary = [
  { from: 'Rajesh Kumar', subject: 'Q1 Attrition Report — Action Needed', preview: 'Hi Team, attached Q1 attrition numbers. Engineering is at 18%...', time: '2h ago', unread: true },
  { from: 'Priya Sharma', subject: 'HRBP Weekly Sync Notes', preview: 'Notes from our weekly sync: 3 new at-risk employees identified...', time: '4h ago', unread: true },
  { from: 'HR Systems', subject: 'Engagement Survey Results Ready', preview: 'The March engagement survey results are now available in the...', time: '1d ago', unread: false },
];

export function NotificationPanel() {
  const { isNotificationOpen, closeNotifications, notifications, markAllAsRead } = useAppStore();
  const [showAISummary, setShowAISummary] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isNotificationOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeNotifications} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed right-16 top-12 z-50',
              'w-[400px] max-h-[540px] overflow-y-auto',
              'bg-surface-card border border-border rounded-xl shadow-lg'
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-text-muted" />
                <span className="text-sm font-semibold font-heading">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-danger text-white px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                )}
              </div>
              <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            </div>

            {/* Mail Summary Section (#3 & #7) */}
            <div className="px-4 py-3 border-b border-border bg-primary/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Mail Overview</span>
                </div>
                {!showAISummary ? (
                  <button onClick={() => setShowAISummary(true)}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-primary text-white px-2 py-1 rounded-full hover:bg-primary-dark transition-colors">
                    <Sparkles size={10} /> Analyze & Summarize
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-success/10 text-success px-2 py-1 rounded-full">
                    <Check size={10} /> Analyzed
                  </span>
                )}
              </div>
              
              {showAISummary ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3 p-3 bg-surface-card border border-primary/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-1 mb-1.5"><Sparkles size={12} className="text-primary" /><span className="text-xs font-bold text-primary">AI Synthesis</span></div>
                  <p className="text-xs leading-relaxed">
                    <strong>Critical:</strong> Engineering attrition is rising (18%), an immediate retention plan is needed. <strong>Update:</strong> 3 new at-risk employees identified from HRBP sync. The March engagement results are now available for review.
                  </p>
                </motion.div>
              ) : null}

              <div className="space-y-2">
                {mailSummary.map((mail, i) => (
                  <div key={i} className={cn('p-2 rounded-lg cursor-pointer hover:bg-surface transition-colors', mail.unread && 'bg-primary/[0.03]')}>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs truncate', mail.unread ? 'font-semibold' : 'font-medium')}>{mail.from}</span>
                      <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">{mail.time}</span>
                    </div>
                    <p className="text-xs font-medium truncate mt-0.5">{mail.subject}</p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">{mail.preview}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular Notifications */}
            <div className="divide-y divide-border">
              {notifications.length === 0 && mailSummary.length === 0 ? (
                <div className="px-4 py-8 text-center text-text-muted text-sm">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  No notifications yet
                </div>
              ) : notifications.length === 0 ? null : (
                notifications.map((notification) => {
                  const SourceIcon = sourceIcons[notification.source];
                  return (
                    <div key={notification.id}
                      className={cn('px-4 py-3 flex gap-3 hover:bg-surface/60 transition-colors cursor-pointer', !notification.read && 'bg-primary/[0.03]')}>
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        notification.source === 'ai' ? 'bg-primary/10 text-primary' :
                        notification.source === 'email' ? 'bg-secondary/10 text-secondary' : 'bg-surface text-text-muted')}>
                        <SourceIcon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm leading-snug', !notification.read && 'font-medium')}>{notification.summary}</p>
                        <p className="text-xs text-text-muted mt-1">{formatRelativeTime(notification.timestamp)}</p>
                        {notification.actionLabel && (
                          <button className="text-xs text-primary font-medium mt-1.5 hover:text-primary-dark transition-colors">{notification.actionLabel} →</button>
                        )}
                      </div>
                      {!notification.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-border">
              <button className="text-xs text-primary font-medium hover:text-primary-dark transition-colors w-full text-center">View all notifications</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
