export type UserRole = 'hro' | 'chro' | 'hrbp';

export interface User {
  id: string;
  name: string;
  firstName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  assignedDepartments?: string[];
  phone?: string;
  lastLogin: string;
  accountStatus: 'active' | 'disabled';
}

export interface Notification {
  id: string;
  source: 'email' | 'ai' | 'system';
  summary: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionLink?: string;
}

export interface ActivityItem {
  id: string;
  type: 'leave_approval' | 'promotion' | 'role_change' | 'profile_update' | 'new_hire' | 'resignation_flagged';
  description: string;
  employeeName: string;
  actedBy: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  dataAccessed: string;
  ipAddress: string;
}

export interface ManualNote {
  id: string;
  employeeId: string;
  employeeName: string;
  content: string;
  preview: string;
  date: string;
  author: string;
  meetingContext?: string;
  aiHighlights?: string[];
}
