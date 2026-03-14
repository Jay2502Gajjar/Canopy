export interface Transcript {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
  meetingType: 'check-in' | 'performance' | 'disciplinary' | 'casual' | '1-on-1';
  date: string;
  duration: string;
  aiStatus: 'analysed' | 'pending' | 'not_analysed';
  content: TranscriptLine[];
  aiAnalysis?: TranscriptAnalysis;
}

export interface TranscriptLine {
  speaker: 'HR Leader' | 'Employee';
  text: string;
  timestamp?: string;
  isHighlighted?: boolean;
}

export interface TranscriptAnalysis {
  keyHighlights: string[];
  sentimentScore: number;
  sentimentLabel: string;
  keyTopics: string[];
  careerGoals: string[];
  concerns: string[];
  actionItems: string[];
}
