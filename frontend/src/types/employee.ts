export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  employeeId: string;
  avatar?: string;
  joinDate: string;
  tenure: string;
  reportingManager: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  sentimentScore: number;
  sentimentTrend: 'positive' | 'neutral' | 'negative' | 'declining';
  memoryScore: number; // 0-100
  riskTier: 'critical' | 'concern' | 'watch' | 'stable';
  lastInteraction: string;
  skills: string[];
  projects: string[];
  interests: string[];
  careerAspirations: string[];
  concerns: { text: string; date: string; meetingRef: string }[];
  sentimentHistory: { date: string; score: number }[];
}

export interface Department {
  id: string;
  name: string;
  employeeCount: number;
  engagementScore: number;
  sentimentStatus: 'stable' | 'declining' | 'burnout_signals' | 'low_hr_coverage';
  delta: number;
  hrbpAssigned?: string;
  meetingsLast30d: number;
}

export interface Commitment {
  id: string;
  employeeId: string;
  employeeName: string;
  text: string;
  dueDate: string;
  sourceMeteting: string;
  sourceMeetingDate: string;
  status: 'overdue' | 'due_soon' | 'on_track' | 'resolved';
  resolved: boolean;
  assignedHrbp?: string;
  createdDaysAgo: number;
}

export interface Meeting {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employeeDept: string;
  meetingType: 'check-in' | 'performance' | 'disciplinary' | 'casual' | '1-on-1';
  date: string;
  time: string;
  duration?: string;
  aiStatus: 'analysed' | 'pending' | 'not_analysed';
}
