export interface RiskEmployee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  riskTier: 'critical' | 'concern' | 'watch' | 'stable';
  indicators: RiskIndicator[];
  lastCheckIn: string;
  daysSinceInteraction: number;
  aiReasoning: string;
  suggestedActions: SuggestedAction[];
}

export type RiskIndicator =
  | 'negative_sentiment'
  | 'repeated_complaints'
  | 'low_engagement'
  | 'burnout_indicators'
  | 'unanswered_commitments';

export const riskIndicatorLabels: Record<RiskIndicator, string> = {
  negative_sentiment: 'Negative Sentiment',
  repeated_complaints: 'Repeated Complaints',
  low_engagement: 'Low Engagement',
  burnout_indicators: 'Burnout Indicators',
  unanswered_commitments: 'Unanswered Commitments',
};

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  type: 'schedule_followup' | 'offer_support' | 'recommend_program';
}
