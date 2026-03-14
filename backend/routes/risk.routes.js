const express = require('express');
const router = express.Router();
const db = require('../db/postgres');
const logger = require('../utils/logger');

/**
 * GET /api/risk-analysis — Calculate and return risk data
 * Risk is calculated using:
 *   - Low sentiment score
 *   - Long time since last HR interaction
 *   - Negative transcript sentiment
 *   - Unresolved commitments
 */
router.get('/', async (req, res) => {
  try {
    // Fetch employees with risk-related data
    const empResult = await db.query(`
      SELECT
        e.id, e.name, e.department, e.sentiment_score, e.risk_tier,
        e.last_interaction, e.sentiment_trend,
        (SELECT COUNT(*) FROM commitments c WHERE c.employee_id = e.id AND c.resolved = false) as open_commitments,
        (SELECT COUNT(*) FROM commitments c WHERE c.employee_id = e.id AND c.status = 'overdue') as overdue_commitments,
        (SELECT MIN(t.ai_analysis->>'sentimentScore')::int FROM transcripts t WHERE t.employee_id = e.id AND t.ai_status = 'analysed') as transcript_sentiment
      FROM employees e
      ORDER BY e.sentiment_score ASC
    `);

    const riskEmployees = empResult.rows
      .map(emp => {
        const daysSinceInteraction = emp.last_interaction
          ? Math.floor((Date.now() - new Date(emp.last_interaction).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Calculate risk score (higher = more at risk)
        let riskScore = 0;
        const indicators = [];

        // Low sentiment (below 50)
        if (emp.sentiment_score < 40) { riskScore += 30; indicators.push('negative_sentiment'); }
        else if (emp.sentiment_score < 55) { riskScore += 15; indicators.push('negative_sentiment'); }

        // Declining sentiment trend
        if (emp.sentiment_trend === 'declining') { riskScore += 15; indicators.push('burnout_indicators'); }

        // Days since interaction (over 30 is concerning)
        if (daysSinceInteraction > 60) { riskScore += 25; indicators.push('low_engagement'); }
        else if (daysSinceInteraction > 30) { riskScore += 10; indicators.push('low_engagement'); }

        // Unresolved commitments
        if (emp.overdue_commitments > 0) { riskScore += 20; indicators.push('unanswered_commitments'); }
        else if (emp.open_commitments > 2) { riskScore += 10; indicators.push('unanswered_commitments'); }

        // Negative transcript sentiment
        if (emp.transcript_sentiment && emp.transcript_sentiment < 40) {
          riskScore += 15;
          if (!indicators.includes('negative_sentiment')) indicators.push('negative_sentiment');
        }

        // Determine risk tier
        let riskTier = 'stable';
        if (riskScore >= 60) riskTier = 'critical';
        else if (riskScore >= 35) riskTier = 'concern';
        else if (riskScore >= 15) riskTier = 'watch';

        // Only include employees with some risk
        if (riskTier === 'stable') return null;

        // Generate AI reasoning
        const reasons = [];
        if (emp.sentiment_score < 50) reasons.push(`Sentiment score is ${emp.sentiment_score}/100`);
        if (daysSinceInteraction > 30) reasons.push(`${daysSinceInteraction} days since last HR interaction`);
        if (emp.overdue_commitments > 0) reasons.push(`${emp.overdue_commitments} overdue commitments`);
        if (emp.sentiment_trend === 'declining') reasons.push('Sentiment trend is declining');

        // Generate suggested actions
        const suggestedActions = [];
        if (daysSinceInteraction > 30) {
          suggestedActions.push({
            id: `a-${emp.id}-1`,
            title: 'Schedule follow-up',
            description: `${daysSinceInteraction} days since last check-in. Arrange an immediate 1-on-1.`,
            type: 'schedule_followup',
          });
        }
        if (emp.sentiment_score < 50) {
          suggestedActions.push({
            id: `a-${emp.id}-2`,
            title: 'Offer workload support',
            description: 'Review current workload and propose support measures.',
            type: 'offer_support',
          });
        }
        if (emp.overdue_commitments > 0) {
          suggestedActions.push({
            id: `a-${emp.id}-3`,
            title: 'Resolve overdue commitments',
            description: `${emp.overdue_commitments} commitments are overdue and need attention.`,
            type: 'offer_support',
          });
        }

        return {
          id: `r-${emp.id}`,
          employeeId: emp.id,
          name: emp.name,
          department: emp.department,
          riskTier,
          indicators: [...new Set(indicators)],
          lastCheckIn: emp.last_interaction,
          daysSinceInteraction,
          aiReasoning: reasons.join('. ') + '.',
          suggestedActions,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const tierOrder = { critical: 0, concern: 1, watch: 2 };
        return (tierOrder[a.riskTier] || 3) - (tierOrder[b.riskTier] || 3);
      });

    res.json(riskEmployees);
  } catch (error) {
    logger.error('Risk analysis failed', { error: error.message });
    res.status(500).json({ message: 'Risk analysis failed' });
  }
});

module.exports = router;
