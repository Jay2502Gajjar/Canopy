import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined) {
  if (!date) return 'N/A';
  try {
    return format(parseISO(date), 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
}

export function formatDateTime(date: string | null | undefined) {
  if (!date) return 'N/A';
  try {
    return format(parseISO(date), 'MMM dd, yyyy · h:mm a');
  } catch {
    return 'Invalid Date';
  }
}

export function formatRelativeTime(date: string | null | undefined) {
  if (!date) return 'Never';
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export function getSentimentColor(score: number): string {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-danger';
}

export function getSentimentLabel(score: number): string {
  if (score >= 70) return 'Positive';
  if (score >= 40) return 'Neutral';
  return 'Negative';
}

export function getRiskTierColor(tier: string): string {
  switch (tier) {
    case 'critical': return 'bg-danger/10 text-danger border-danger/30';
    case 'concern': return 'bg-warning/10 text-warning border-warning/30';
    case 'watch': return 'bg-amber-400/10 text-amber-500 border-amber-400/30';
    case 'stable': return 'bg-success/10 text-success border-success/30';
    default: return 'bg-text-muted/10 text-text-muted';
  }
}

export function getMemoryScoreLabel(score: number): string {
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Moderate';
  return 'Weak';
}

export function getMemoryScoreColor(score: number): string {
  if (score >= 70) return 'bg-primary';
  if (score >= 40) return 'bg-warning';
  return 'bg-danger';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
