const { google } = require('googleapis');
const groqService = require('./groq.service');
const logger = require('../utils/logger');

/**
 * Create an OAuth2 client for Gmail
 */
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/auth/google/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

/**
 * Fetch recent emails from Gmail
 */
async function fetchEmails(maxResults = 10) {
  try {
    const auth = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    const result = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'category:primary',
    });

    const messages = result.data.messages || [];
    const emails = [];

    for (const m of messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: m.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });

      const headers = msg.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const snippet = msg.data.snippet || '';

      emails.push({
        id: m.id,
        from,
        subject,
        date,
        snippet,
      });
    }

    logger.info('Fetched emails from Gmail', { count: emails.length });
    return emails;
  } catch (error) {
    logger.error('Failed to fetch emails', { error: error.message });
    throw error;
  }
}

/**
 * Generate AI summaries for emails
 */
async function generateEmailSummaries(emails) {
  try {
    const summaries = [];

    for (const email of emails.slice(0, 5)) {
      try {
        const summary = await groqService.chat(
          `Summarize this email in one concise sentence for an HR dashboard notification:\nFrom: ${email.from}\nSubject: ${email.subject}\nSnippet: ${email.snippet}`,
          { role: 'system' }
        );

        summaries.push({
          id: email.id,
          source: 'email',
          summary: summary.trim(),
          from: email.from,
          subject: email.subject,
          timestamp: email.date,
          read: false,
        });
      } catch {
        summaries.push({
          id: email.id,
          source: 'email',
          summary: `${email.subject} — from ${email.from}`,
          from: email.from,
          subject: email.subject,
          timestamp: email.date,
          read: false,
        });
      }
    }

    logger.info('Email summaries generated', { count: summaries.length });
    return summaries;
  } catch (error) {
    logger.error('Failed to generate email summaries', { error: error.message });
    throw error;
  }
}

module.exports = { getOAuth2Client, fetchEmails, generateEmailSummaries };
