import type { Employee, Department, Commitment, Meeting } from '@/types/employee';
import type { Transcript, TranscriptLine, TranscriptAnalysis } from '@/types/transcript';
import type { RiskEmployee } from '@/types/risk';
import type { User, Notification, ActivityItem, ManualNote } from '@/types/user';

export const mockUser: User = {
  id: 'u1',
  name: 'Sarah Mitchell',
  firstName: 'Sarah',
  email: 'sarah.mitchell@canopy.io',
  role: 'hro',
  department: 'Human Resources',
  avatar: '',
  phone: '+1 555-0101',
  lastLogin: '2026-03-13T18:00:00Z',
  accountStatus: 'active',
};

export const mockEmployees: Employee[] = [
  {
    id: 'e1', name: 'Rahul Kumar', email: 'rahul.kumar@canopy.io', role: 'Senior Engineer',
    department: 'Engineering', employeeId: 'EMP-1001', joinDate: '2023-06-15',
    tenure: '2y 9m', reportingManager: 'Priya Sharma', employmentType: 'Full-time',
    sentimentScore: 42, sentimentTrend: 'declining', memoryScore: 78,
    riskTier: 'concern', lastInteraction: '2026-02-28',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS'], projects: ['Platform Rebuild', 'API Gateway'],
    interests: ['Open source', 'Tech leadership', 'System design'],
    careerAspirations: ['Move into engineering management', 'Lead a product team'],
    concerns: [
      { text: 'Feeling overworked with Platform Rebuild deadlines', date: '2026-02-28', meetingRef: 'Check-in Feb 28' },
      { text: 'Concerned about limited growth opportunities', date: '2026-01-15', meetingRef: 'Performance Review Q1' },
    ],
    sentimentHistory: [
      { date: '2025-10-01', score: 72 }, { date: '2025-11-01', score: 65 },
      { date: '2025-12-01', score: 58 }, { date: '2026-01-01', score: 50 },
      { date: '2026-02-01', score: 42 },
    ],
  },
  {
    id: 'e2', name: 'Ananya Patel', email: 'ananya.patel@canopy.io', role: 'Product Manager',
    department: 'Product', employeeId: 'EMP-1002', joinDate: '2022-03-10',
    tenure: '4y 0m', reportingManager: 'Vikram Singh', employmentType: 'Full-time',
    sentimentScore: 85, sentimentTrend: 'positive', memoryScore: 92,
    riskTier: 'stable', lastInteraction: '2026-03-10',
    skills: ['Product Strategy', 'User Research', 'Roadmapping', 'Agile'],
    projects: ['Customer Portal', 'Mobile App v2'], interests: ['UX research', 'Data-driven decisions'],
    careerAspirations: ['VP of Product within 3 years'],
    concerns: [],
    sentimentHistory: [
      { date: '2025-10-01', score: 80 }, { date: '2025-11-01', score: 82 },
      { date: '2025-12-01', score: 78 }, { date: '2026-01-01', score: 84 },
      { date: '2026-02-01', score: 85 },
    ],
  },
  {
    id: 'e3', name: 'Deepak Verma', email: 'deepak.verma@canopy.io', role: 'QA Lead',
    department: 'Engineering', employeeId: 'EMP-1003', joinDate: '2021-08-22',
    tenure: '4y 7m', reportingManager: 'Priya Sharma', employmentType: 'Full-time',
    sentimentScore: 35, sentimentTrend: 'declining', memoryScore: 45,
    riskTier: 'critical', lastInteraction: '2026-01-05',
    skills: ['Automation Testing', 'Selenium', 'CI/CD', 'Performance Testing'],
    projects: ['QA Framework', 'Release Pipeline'], interests: ['DevOps', 'Quality culture'],
    careerAspirations: ['Transition to Engineering Manager role'],
    concerns: [
      { text: 'Team is too small for workload', date: '2026-01-05', meetingRef: 'Check-in Jan 5' },
      { text: 'No recognition for overtime during releases', date: '2025-11-20', meetingRef: '1-on-1 Nov' },
      { text: 'Frustrated with lack of promotion clarity', date: '2025-10-10', meetingRef: 'Performance Review Q3' },
    ],
    sentimentHistory: [
      { date: '2025-10-01', score: 55 }, { date: '2025-11-01', score: 48 },
      { date: '2025-12-01', score: 42 }, { date: '2026-01-01', score: 35 },
      { date: '2026-02-01', score: 35 },
    ],
  },
  {
    id: 'e4', name: 'Meera Nair', email: 'meera.nair@canopy.io', role: 'UX Designer',
    department: 'Design', employeeId: 'EMP-1004', joinDate: '2024-01-10',
    tenure: '2y 2m', reportingManager: 'Arjun Rao', employmentType: 'Full-time',
    sentimentScore: 68, sentimentTrend: 'neutral', memoryScore: 55,
    riskTier: 'watch', lastInteraction: '2026-03-01',
    skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
    projects: ['Design System v2', 'Customer Portal'], interests: ['Accessibility', 'Design thinking'],
    careerAspirations: ['Lead a design team', 'Speak at design conferences'],
    concerns: [
      { text: 'Concerned about siloed work between design and engineering', date: '2026-03-01', meetingRef: 'Check-in Mar 1' },
    ],
    sentimentHistory: [
      { date: '2025-10-01', score: 70 }, { date: '2025-11-01', score: 72 },
      { date: '2025-12-01', score: 68 }, { date: '2026-01-01', score: 65 },
      { date: '2026-02-01', score: 68 },
    ],
  },
  {
    id: 'e5', name: 'Arjun Menon', email: 'arjun.menon@canopy.io', role: 'Sales Director',
    department: 'Sales', employeeId: 'EMP-1005', joinDate: '2020-11-05',
    tenure: '5y 4m', reportingManager: 'Kavitha Das', employmentType: 'Full-time',
    sentimentScore: 52, sentimentTrend: 'declining', memoryScore: 62,
    riskTier: 'concern', lastInteraction: '2026-02-15',
    skills: ['Enterprise Sales', 'Negotiation', 'CRM', 'Team Leadership'],
    projects: ['Q1 Revenue Target', 'Partner Channel'], interests: ['Mentoring juniors', 'Golf'],
    careerAspirations: ['VP Sales', 'Build APAC sales division'],
    concerns: [
      { text: 'Sales targets may be unrealistic given market conditions', date: '2026-02-15', meetingRef: 'Check-in Feb 15' },
      { text: 'Losing experienced team members to competitors', date: '2026-01-20', meetingRef: '1-on-1 Jan' },
    ],
    sentimentHistory: [
      { date: '2025-10-01', score: 65 }, { date: '2025-11-01', score: 60 },
      { date: '2025-12-01', score: 58 }, { date: '2026-01-01', score: 55 },
      { date: '2026-02-01', score: 52 },
    ],
  },
  {
    id: 'e6', name: 'Kavitha Das', email: 'kavitha.das@canopy.io', role: 'VP Operations',
    department: 'Operations', employeeId: 'EMP-1006', joinDate: '2019-04-01',
    tenure: '6y 11m', reportingManager: 'CEO', employmentType: 'Full-time',
    sentimentScore: 78, sentimentTrend: 'positive', memoryScore: 88,
    riskTier: 'stable', lastInteraction: '2026-03-12',
    skills: ['Operations Strategy', 'Process Optimization', 'Budgeting', 'Vendor Management'],
    projects: ['Ops Excellence Program', 'Cost Optimization'], interests: ['Leadership coaching', 'Running'],
    careerAspirations: ['COO track'],
    concerns: [],
    sentimentHistory: [
      { date: '2025-10-01', score: 75 }, { date: '2025-11-01', score: 76 },
      { date: '2025-12-01', score: 78 }, { date: '2026-01-01', score: 77 },
      { date: '2026-02-01', score: 78 },
    ],
  },
  {
    id: 'e7', name: 'Siddharth Joshi', email: 'sid.joshi@canopy.io', role: 'Data Analyst',
    department: 'Engineering', employeeId: 'EMP-1007', joinDate: '2024-07-20',
    tenure: '1y 8m', reportingManager: 'Priya Sharma', employmentType: 'Full-time',
    sentimentScore: 60, sentimentTrend: 'neutral', memoryScore: 38,
    riskTier: 'watch', lastInteraction: '2026-02-20',
    skills: ['Python', 'SQL', 'Tableau', 'Machine Learning'],
    projects: ['Analytics Dashboard', 'Data Pipeline'], interests: ['AI/ML research', 'Chess'],
    careerAspirations: ['Become a lead data scientist'],
    concerns: [
      { text: 'Would like more challenging projects', date: '2026-02-20', meetingRef: 'Check-in Feb 20' },
    ],
    sentimentHistory: [
      { date: '2025-10-01', score: 65 }, { date: '2025-11-01', score: 63 },
      { date: '2025-12-01', score: 60 }, { date: '2026-01-01', score: 62 },
      { date: '2026-02-01', score: 60 },
    ],
  },
  {
    id: 'e8', name: 'Nisha Reddy', email: 'nisha.reddy@canopy.io', role: 'Marketing Manager',
    department: 'Marketing', employeeId: 'EMP-1008', joinDate: '2022-09-12',
    tenure: '3y 6m', reportingManager: 'Vikram Singh', employmentType: 'Full-time',
    sentimentScore: 74, sentimentTrend: 'positive', memoryScore: 72,
    riskTier: 'stable', lastInteraction: '2026-03-08',
    skills: ['Content Strategy', 'SEO', 'Brand Management', 'Analytics'],
    projects: ['Brand Refresh', 'Lead Gen Campaign'], interests: ['Creative writing', 'Photography'],
    careerAspirations: ['Head of Marketing', 'Build a content studio'],
    concerns: [],
    sentimentHistory: [
      { date: '2025-10-01', score: 70 }, { date: '2025-11-01', score: 72 },
      { date: '2025-12-01', score: 73 }, { date: '2026-01-01', score: 74 },
      { date: '2026-02-01', score: 74 },
    ],
  },
];

export const mockDepartments: Department[] = [
  { id: 'd1', name: 'Engineering', employeeCount: 45, engagementScore: 62, sentimentStatus: 'burnout_signals', delta: -5, hrbpAssigned: 'Priya Sharma', meetingsLast30d: 8 },
  { id: 'd2', name: 'Product', employeeCount: 18, engagementScore: 81, sentimentStatus: 'stable', delta: 3, hrbpAssigned: 'Vikram Singh', meetingsLast30d: 6 },
  { id: 'd3', name: 'Design', employeeCount: 12, engagementScore: 70, sentimentStatus: 'stable', delta: -1, hrbpAssigned: 'Arjun Rao', meetingsLast30d: 4 },
  { id: 'd4', name: 'Sales', employeeCount: 32, engagementScore: 55, sentimentStatus: 'declining', delta: -8, hrbpAssigned: 'Kavitha Das', meetingsLast30d: 3 },
  { id: 'd5', name: 'Marketing', employeeCount: 15, engagementScore: 76, sentimentStatus: 'stable', delta: 2, hrbpAssigned: 'Vikram Singh', meetingsLast30d: 5 },
  { id: 'd6', name: 'Operations', employeeCount: 22, engagementScore: 72, sentimentStatus: 'stable', delta: 1, hrbpAssigned: 'Kavitha Das', meetingsLast30d: 4 },
  { id: 'd7', name: 'Finance', employeeCount: 10, engagementScore: 68, sentimentStatus: 'low_hr_coverage', delta: 0, meetingsLast30d: 1 },
];

export const mockCommitments: Commitment[] = [
  { id: 'c1', employeeId: 'e1', employeeName: 'Rahul Kumar', text: 'Discuss promotion timeline and criteria', dueDate: '2026-03-15', sourceMeteting: 'Check-in', sourceMeetingDate: '2026-02-28', status: 'due_soon', resolved: false, createdDaysAgo: 13 },
  { id: 'c2', employeeId: 'e3', employeeName: 'Deepak Verma', text: 'Review QA team headcount request', dueDate: '2026-02-28', sourceMeteting: 'Check-in', sourceMeetingDate: '2026-01-05', status: 'overdue', resolved: false, createdDaysAgo: 67 },
  { id: 'c3', employeeId: 'e5', employeeName: 'Arjun Menon', text: 'Revisit Q2 sales targets with leadership', dueDate: '2026-03-20', sourceMeteting: 'Check-in', sourceMeetingDate: '2026-02-15', status: 'on_track', resolved: false, createdDaysAgo: 26 },
  { id: 'c4', employeeId: 'e4', employeeName: 'Meera Nair', text: 'Schedule cross-team workshop with engineering', dueDate: '2026-03-10', sourceMeteting: 'Check-in', sourceMeetingDate: '2026-03-01', status: 'overdue', resolved: false, createdDaysAgo: 12 },
  { id: 'c5', employeeId: 'e7', employeeName: 'Siddharth Joshi', text: 'Identify stretch project for data science exposure', dueDate: '2026-03-25', sourceMeteting: 'Check-in', sourceMeetingDate: '2026-02-20', status: 'on_track', resolved: false, createdDaysAgo: 21 },
  { id: 'c6', employeeId: 'e2', employeeName: 'Ananya Patel', text: 'Share VP Product career development resources', dueDate: '2026-02-20', sourceMeteting: 'Performance Review', sourceMeetingDate: '2026-01-15', status: 'resolved', resolved: true, createdDaysAgo: 57 },
];

export const mockMeetings: Meeting[] = [
  { id: 'm1', employeeId: 'e1', employeeName: 'Rahul Kumar', employeeDept: 'Engineering', meetingType: 'check-in', date: '2026-03-15', time: '10:00 AM', aiStatus: 'pending' },
  { id: 'm2', employeeId: 'e3', employeeName: 'Deepak Verma', employeeDept: 'Engineering', meetingType: '1-on-1', date: '2026-03-16', time: '2:00 PM', aiStatus: 'pending' },
  { id: 'm3', employeeId: 'e5', employeeName: 'Arjun Menon', employeeDept: 'Sales', meetingType: 'check-in', date: '2026-03-17', time: '11:30 AM', aiStatus: 'pending' },
  { id: 'm4', employeeId: 'e4', employeeName: 'Meera Nair', employeeDept: 'Design', meetingType: 'casual', date: '2026-03-18', time: '3:00 PM', aiStatus: 'pending' },
];

export const mockTranscripts: Transcript[] = [
  {
    id: 't1', employeeId: 'e1', employeeName: 'Rahul Kumar', employeeDept: 'Engineering',
    meetingType: 'check-in', date: '2026-02-28', duration: '35 min', aiStatus: 'analysed',
    content: [
      { speaker: 'HR Leader', text: 'Hi Rahul, thanks for making time today. How have things been since our last chat?' },
      { speaker: 'Employee', text: 'Honestly, it\'s been a bit rough. The Platform Rebuild deadlines are really tight and I feel like I\'m carrying a lot of the technical decisions alone.' },
      { speaker: 'HR Leader', text: 'I understand. That sounds like a lot of pressure. Has your manager been able to support you with the workload?' },
      { speaker: 'Employee', text: 'Priya tries, but she\'s stretched thin too. I think we need more senior engineers on the project.', isHighlighted: true },
      { speaker: 'HR Leader', text: 'That\'s a valid concern. Let me look into the resourcing situation. On another note, you mentioned wanting to move into management — is that still something you\'re interested in?' },
      { speaker: 'Employee', text: 'Definitely. But I don\'t see a clear path here. I\'ve been a senior engineer for two years now and nobody has talked to me about what it takes to get promoted.', isHighlighted: true },
      { speaker: 'HR Leader', text: 'I\'ll make sure we discuss a promotion timeline and criteria with you in our next session. I want to make sure you feel valued here.' },
      { speaker: 'Employee', text: 'I appreciate that. I just want clarity — that would go a long way.' },
    ],
    aiAnalysis: {
      keyHighlights: [
        'Employee feels overwhelmed with Platform Rebuild workload',
        'Requests more senior engineering support',
        'Strong interest in engineering management career path',
        'Lacks clarity on promotion criteria — has been waiting 2 years',
      ],
      sentimentScore: 42,
      sentimentLabel: 'Declining — signs of frustration and burnout',
      keyTopics: ['Workload', 'Career Growth', 'Promotion', 'Team Resourcing'],
      careerGoals: ['Engineering management', 'Product team leadership'],
      concerns: ['Overwork and burnout risk', 'Unclear promotion path', 'Insufficient team support'],
      actionItems: ['Discuss promotion timeline', 'Review team resourcing for Platform Rebuild', 'Follow up on management track'],
    },
  },
  {
    id: 't2', employeeId: 'e3', employeeName: 'Deepak Verma', employeeDept: 'Engineering',
    meetingType: 'check-in', date: '2026-01-05', duration: '28 min', aiStatus: 'analysed',
    content: [
      { speaker: 'HR Leader', text: 'Deepak, good to see you. How has the new year started?' },
      { speaker: 'Employee', text: 'Not great, to be honest. We had three releases back to back in December and I worked overtime every single week. No one even acknowledged it.', isHighlighted: true },
      { speaker: 'HR Leader', text: 'I\'m sorry to hear that. Recognition is important. Have you raised this with your manager?' },
      { speaker: 'Employee', text: 'I tried, but the response was basically "that\'s just how release cycles work." I don\'t think that\'s acceptable.' },
      { speaker: 'HR Leader', text: 'You\'re right to feel that way. Let me escalate this. What would meaningful recognition look like for you?' },
      { speaker: 'Employee', text: 'Even just a mention in the all-hands or a bonus for the extra hours would help. Right now I feel invisible.', isHighlighted: true },
    ],
    aiAnalysis: {
      keyHighlights: [
        'Significant overtime during December releases — no recognition received',
        'Employee feeling invisible and undervalued',
        'Manager dismissed the concern as normal release cycle behavior',
        'Employee wants public recognition or compensation for extra effort',
      ],
      sentimentScore: 35,
      sentimentLabel: 'Negative — significant frustration and disengagement risk',
      keyTopics: ['Recognition', 'Overtime', 'Management Response', 'Morale'],
      careerGoals: ['Engineering Manager transition'],
      concerns: ['Lack of recognition', 'Excessive overtime', 'Poor management response', 'Flight risk'],
      actionItems: ['Review QA team headcount', 'Address recognition gap', 'Escalate management response concern'],
    },
  },
];

export const mockRiskEmployees: RiskEmployee[] = [
  {
    id: 'r1', employeeId: 'e3', name: 'Deepak Verma', department: 'Engineering',
    riskTier: 'critical', indicators: ['negative_sentiment', 'burnout_indicators', 'unanswered_commitments'],
    lastCheckIn: '2026-01-05', daysSinceInteraction: 67,
    aiReasoning: 'Deepak has shown consistently declining sentiment over 4 months. He raised concerns about lack of recognition and excessive overtime in his last check-in (Jan 5). The QA team headcount commitment remains unresolved after 67 days. Combined with 67 days without HR interaction, this represents a critical retention risk.',
    suggestedActions: [
      { id: 'a1', title: 'Schedule urgent follow-up', description: 'Arrange an immediate 1-on-1 to address recognition concerns and headcount request', type: 'schedule_followup' },
      { id: 'a2', title: 'Offer workload support', description: 'Propose temporary resource allocation to ease QA workload during release cycles', type: 'offer_support' },
      { id: 'a3', title: 'Recommend recognition program', description: 'Enroll team in peer recognition program and propose overtime compensation review', type: 'recommend_program' },
    ],
  },
  {
    id: 'r2', employeeId: 'e1', name: 'Rahul Kumar', department: 'Engineering',
    riskTier: 'concern', indicators: ['negative_sentiment', 'burnout_indicators'],
    lastCheckIn: '2026-02-28', daysSinceInteraction: 13,
    aiReasoning: 'Rahul\'s sentiment has declined from 72 to 42 over 5 months. He expressed frustration about unclear promotion criteria and heavy workload from the Platform Rebuild. While he had a recent check-in, his core concerns remain unaddressed.',
    suggestedActions: [
      { id: 'a4', title: 'Schedule promotion discussion', description: 'Set up meeting with engineering leadership to define clear promotion timeline and criteria', type: 'schedule_followup' },
      { id: 'a5', title: 'Review project resourcing', description: 'Assess Platform Rebuild team and propose additional senior engineering support', type: 'offer_support' },
    ],
  },
  {
    id: 'r3', employeeId: 'e5', name: 'Arjun Menon', department: 'Sales',
    riskTier: 'concern', indicators: ['negative_sentiment', 'low_engagement'],
    lastCheckIn: '2026-02-15', daysSinceInteraction: 26,
    aiReasoning: 'Arjun has raised concerns about unrealistic sales targets and team attrition. His sentiment has dropped steadily. Two experienced team members left last quarter, adding pressure. He may consider external opportunities if concerns persist.',
    suggestedActions: [
      { id: 'a6', title: 'Target review meeting', description: 'Arrange meeting with leadership to reassess Q2 targets given market conditions and team changes', type: 'schedule_followup' },
    ],
  },
  {
    id: 'r4', employeeId: 'e4', name: 'Meera Nair', department: 'Design',
    riskTier: 'watch', indicators: ['low_engagement'],
    lastCheckIn: '2026-03-01', daysSinceInteraction: 12,
    aiReasoning: 'Meera expressed concerns about siloed work between design and engineering. While not critical, this isolation can lead to disengagement over time. Her sentiment is neutral but monitoring is recommended.',
    suggestedActions: [
      { id: 'a7', title: 'Cross-team workshop', description: 'Facilitate design-engineering collaboration workshop', type: 'offer_support' },
    ],
  },
  {
    id: 'r5', employeeId: 'e7', name: 'Siddharth Joshi', department: 'Engineering',
    riskTier: 'watch', indicators: ['low_engagement'],
    lastCheckIn: '2026-02-20', daysSinceInteraction: 21,
    aiReasoning: 'Siddharth mentioned wanting more challenging projects. His memory score is low (38), suggesting limited relationship context. Early career talent with potential flight risk if not intellectually stimulated.',
    suggestedActions: [
      { id: 'a8', title: 'Stretch assignment', description: 'Identify a data science stretch project with cross-functional exposure', type: 'offer_support' },
    ],
  },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', source: 'ai', summary: 'Deepak Verma flagged as critical retention risk — 67 days without check-in', timestamp: '2026-03-13T16:00:00Z', read: false, actionLabel: 'View Employee', actionLink: '/hro/employees/e3' },
  { id: 'n2', source: 'system', summary: 'Transcript analysis complete for Rahul Kumar check-in (Feb 28)', timestamp: '2026-03-13T14:30:00Z', read: false, actionLabel: 'View Analysis', actionLink: '/hro/transcripts/t1' },
  { id: 'n3', source: 'ai', summary: 'New commitment extracted: "Discuss promotion timeline" for Rahul Kumar', timestamp: '2026-03-13T14:32:00Z', read: true },
  { id: 'n4', source: 'email', summary: 'Leave request from Meera Nair — 3 days starting March 20', timestamp: '2026-03-13T10:00:00Z', read: true, actionLabel: 'Review', actionLink: '#' },
  { id: 'n5', source: 'ai', summary: 'Burnout signals detected in Engineering department — 4 employees affected', timestamp: '2026-03-12T18:00:00Z', read: true, actionLabel: 'Investigate', actionLink: '/hro/risk' },
];

export const mockActivities: ActivityItem[] = [
  { id: 'act1', type: 'resignation_flagged', description: 'AI flagged potential resignation risk', employeeName: 'Deepak Verma', actedBy: 'AI System', timestamp: '2026-03-13T16:00:00Z' },
  { id: 'act2', type: 'profile_update', description: 'Transcript analysis completed and insights saved', employeeName: 'Rahul Kumar', actedBy: 'AI System', timestamp: '2026-03-13T14:30:00Z' },
  { id: 'act3', type: 'leave_approval', description: 'Annual leave approved (Mar 20-22)', employeeName: 'Meera Nair', actedBy: 'Sarah Mitchell', timestamp: '2026-03-13T10:15:00Z' },
  { id: 'act4', type: 'promotion', description: 'Promoted from Senior PM to Lead PM', employeeName: 'Ananya Patel', actedBy: 'HR Admin', timestamp: '2026-03-10T09:00:00Z' },
  { id: 'act5', type: 'new_hire', description: 'Onboarding initiated for new Data Engineer', employeeName: 'Rohan Mehta', actedBy: 'Sarah Mitchell', timestamp: '2026-03-08T11:00:00Z' },
  { id: 'act6', type: 'role_change', description: 'Moved from Engineering to Product team', employeeName: 'Priya Iyer', actedBy: 'HR Admin', timestamp: '2026-03-05T14:00:00Z' },
];

export const mockNotes: ManualNote[] = [
  { id: 'note1', employeeId: 'e1', employeeName: 'Rahul Kumar', content: 'Rahul seems genuinely frustrated about the promotion situation. He\'s been patient for two years but I can sense he\'s reaching a tipping point. Need to accelerate the conversation with engineering leadership about creating a clear management track for senior engineers.', preview: 'Rahul seems genuinely frustrated about the promotion situation...', date: '2026-03-01', author: 'Sarah Mitchell', meetingContext: 'Post check-in Feb 28', aiHighlights: ['Promotion frustration at tipping point', 'Management track needed for senior engineers'] },
  { id: 'note2', employeeId: 'e3', employeeName: 'Deepak Verma', content: 'Deepak\'s situation is concerning. He\'s been overlooked for months despite putting in significant overtime. The QA team genuinely needs more people — this isn\'t just a morale issue, it\'s a capacity problem. Need to push the headcount request harder.', preview: 'Deepak\'s situation is concerning. He\'s been overlooked for months...', date: '2026-01-08', author: 'Sarah Mitchell', meetingContext: 'Post check-in Jan 5', aiHighlights: ['Critical capacity issue in QA', 'Headcount request needs escalation'] },
  { id: 'note3', employeeId: 'e5', employeeName: 'Arjun Menon', content: 'The sales team is under heavy pressure. Arjun is putting on a brave face but losing two experienced reps last quarter has clearly impacted morale. The targets were set before the attrition happened and haven\'t been adjusted.', preview: 'The sales team is under heavy pressure. Arjun is putting on...', date: '2026-02-16', author: 'Sarah Mitchell', aiHighlights: ['Team attrition impacting morale', 'Targets not adjusted post-attrition'] },
];

export const mockGraphNodes = [
  { id: 'e1', name: 'Rahul Kumar', type: 'employee', department: 'Engineering' },
  { id: 'e2', name: 'Ananya Patel', type: 'employee', department: 'Product' },
  { id: 'e3', name: 'Deepak Verma', type: 'employee', department: 'Engineering' },
  { id: 'e4', name: 'Meera Nair', type: 'employee', department: 'Design' },
  { id: 'e5', name: 'Arjun Menon', type: 'employee', department: 'Sales' },
  { id: 'e6', name: 'Kavitha Das', type: 'employee', department: 'Operations' },
  { id: 'e7', name: 'Siddharth Joshi', type: 'employee', department: 'Engineering' },
  { id: 'e8', name: 'Nisha Reddy', type: 'employee', department: 'Marketing' },
  { id: 'g1', name: 'Engineering Management', type: 'career_goal' },
  { id: 'g2', name: 'VP of Product', type: 'career_goal' },
  { id: 'g3', name: 'VP Sales', type: 'career_goal' },
  { id: 'g4', name: 'Lead Data Scientist', type: 'career_goal' },
  { id: 'g5', name: 'Head of Marketing', type: 'career_goal' },
  { id: 'g6', name: 'COO Track', type: 'career_goal' },
  { id: 'p1', name: 'Platform Rebuild', type: 'project' },
  { id: 'p2', name: 'Customer Portal', type: 'project' },
  { id: 'p3', name: 'Design System v2', type: 'project' },
  { id: 'p4', name: 'Analytics Dashboard', type: 'project' },
  { id: 'cn1', name: 'Workload Concerns', type: 'concern' },
  { id: 'cn2', name: 'Lack of Recognition', type: 'concern' },
  { id: 'cn3', name: 'Unclear Promotion Path', type: 'concern' },
  { id: 'cn4', name: 'Unrealistic Targets', type: 'concern' },
  { id: 's1', name: 'React', type: 'skill' },
  { id: 's2', name: 'TypeScript', type: 'skill' },
  { id: 's3', name: 'Python', type: 'skill' },
  { id: 's4', name: 'Product Strategy', type: 'skill' },
  { id: 'd1', name: 'Engineering', type: 'department' },
  { id: 'd2', name: 'Product', type: 'department' },
  { id: 'd3', name: 'Design', type: 'department' },
  { id: 'd4', name: 'Sales', type: 'department' },
  { id: 'm1', name: 'Priya Sharma', type: 'manager' },
  { id: 'm2', name: 'Vikram Singh', type: 'manager' },
];

export const mockGraphLinks = [
  { source: 'e1', target: 'g1', label: 'Interested in' },
  { source: 'e2', target: 'g2', label: 'Interested in' },
  { source: 'e5', target: 'g3', label: 'Interested in' },
  { source: 'e7', target: 'g4', label: 'Interested in' },
  { source: 'e8', target: 'g5', label: 'Interested in' },
  { source: 'e6', target: 'g6', label: 'Interested in' },
  { source: 'e1', target: 'p1', label: 'Works on' },
  { source: 'e2', target: 'p2', label: 'Works on' },
  { source: 'e4', target: 'p3', label: 'Works on' },
  { source: 'e4', target: 'p2', label: 'Works on' },
  { source: 'e7', target: 'p4', label: 'Works on' },
  { source: 'e1', target: 'cn1', label: 'Raised concern' },
  { source: 'e3', target: 'cn2', label: 'Raised concern' },
  { source: 'e1', target: 'cn3', label: 'Raised concern' },
  { source: 'e3', target: 'cn3', label: 'Raised concern' },
  { source: 'e5', target: 'cn4', label: 'Raised concern' },
  { source: 'e1', target: 's1', label: 'Has skill' },
  { source: 'e1', target: 's2', label: 'Has skill' },
  { source: 'e7', target: 's3', label: 'Has skill' },
  { source: 'e2', target: 's4', label: 'Has skill' },
  { source: 'e1', target: 'd1', label: 'In dept' },
  { source: 'e3', target: 'd1', label: 'In dept' },
  { source: 'e7', target: 'd1', label: 'In dept' },
  { source: 'e2', target: 'd2', label: 'In dept' },
  { source: 'e4', target: 'd3', label: 'In dept' },
  { source: 'e5', target: 'd4', label: 'In dept' },
  { source: 'e1', target: 'm1', label: 'Reports to' },
  { source: 'e3', target: 'm1', label: 'Reports to' },
  { source: 'e2', target: 'm2', label: 'Reports to' },
  { source: 'e6', target: 'e5', label: 'Mentored' },
];
