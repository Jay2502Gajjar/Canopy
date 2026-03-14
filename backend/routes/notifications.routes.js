const express = require('express');
const router = express.Router();
const db = require('../db/postgres');
const gmailService = require('../services/gmail.service');
const logger = require('../utils/logger');

/**
 * GET /api/notifications — Get all notifications
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, source, summary, timestamp, read, action_label, action_link
       FROM notifications ORDER BY timestamp DESC LIMIT 50`
    );

    const notifications = result.rows.map(n => ({
      id: n.id,
      source: n.source,
      summary: n.summary,
      timestamp: n.timestamp,
      read: n.read,
      actionLabel: n.action_label,
      actionLink: n.action_link,
    }));

    res.json(notifications);
  } catch (error) {
    logger.error('Failed to fetch notifications', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/:id/read — Mark notification as read
 */
router.post('/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read = true WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Failed to mark notification', { error: error.message });
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

/**
 * GET /api/notifications/mail-summary — Get email summaries
 */
router.get('/mail-summary', async (req, res) => {
  try {
    const emails = await gmailService.fetchEmails(5);
    const summaries = await gmailService.generateEmailSummaries(emails);
    res.json(summaries);
  } catch (error) {
    logger.error('Failed to fetch email summaries', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch email summaries' });
  }
});

module.exports = router;
