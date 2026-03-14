require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { WebSocketServer } = require('ws');
const http = require('http');
const logger = require('./utils/logger');
const db = require('./db/postgres');
const chromaService = require('./services/chroma.service');

// Route imports
const authRoutes = require('./routes/auth.routes');
const employeesRoutes = require('./routes/employees.routes');
const transcriptsRoutes = require('./routes/transcripts.routes');
const aiRoutes = require('./routes/ai.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const riskRoutes = require('./routes/risk.routes');
const notesRoutes = require('./routes/notes.routes');
const recentChangesRoutes = require('./routes/recent-changes.routes');

const app = express();
const server = http.createServer(app);

/* ============================================ */
/*  MIDDLEWARE                                  */
/* ============================================ */

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

/* ============================================ */
/*  API ROUTES                                  */
/* ============================================ */

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/transcripts', transcriptsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/risk-analysis', riskRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/recent-changes', recentChangesRoutes);

/* ============================================ */
/*  ADDITIONAL ENDPOINTS                        */
/*  (Matching frontend lib/api/index.ts)        */
/* ============================================ */

// --- Meetings ---
app.get('/api/meetings', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, employee_id, employee_name, employee_dept, meeting_type, date, time, duration, ai_status
      FROM meetings ORDER BY date ASC
    `);
    res.json(result.rows.map(m => ({
      id: m.id, employeeId: m.employee_id, employeeName: m.employee_name,
      employeeDept: m.employee_dept, meetingType: m.meeting_type, date: m.date,
      time: m.time, duration: m.duration, aiStatus: m.ai_status,
    })));
  } catch (error) {
    logger.error('Failed to fetch meetings', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch meetings' });
  }
});

app.get('/api/meetings/upcoming', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, employee_id, employee_name, employee_dept, meeting_type, date, time, duration, ai_status
      FROM meetings WHERE date >= CURRENT_DATE ORDER BY date ASC LIMIT 10
    `);
    res.json(result.rows.map(m => ({
      id: m.id, employeeId: m.employee_id, employeeName: m.employee_name,
      employeeDept: m.employee_dept, meetingType: m.meeting_type, date: m.date,
      time: m.time, duration: m.duration, aiStatus: m.ai_status,
    })));
  } catch (error) {
    logger.error('Failed to fetch upcoming meetings', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch upcoming meetings' });
  }
});

app.get('/api/meetings/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM meetings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Meeting not found' });
    const m = result.rows[0];
    res.json({
      id: m.id, employeeId: m.employee_id, employeeName: m.employee_name,
      employeeDept: m.employee_dept, meetingType: m.meeting_type, date: m.date,
      time: m.time, duration: m.duration, aiStatus: m.ai_status,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meeting' });
  }
});

// POST /api/meetings — Create a new meeting
app.post('/api/meetings', async (req, res) => {
  try {
    const { employeeId, employeeName, employeeDept, meetingType, date, time, duration } = req.body;
    if (!employeeId || !date) {
      return res.status(400).json({ message: 'employeeId and date are required' });
    }
    const result = await db.query(
      `INSERT INTO meetings (employee_id, employee_name, employee_dept, meeting_type, date, time, duration, ai_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [employeeId, employeeName, employeeDept, meetingType || 'check-in', date, time || '10:00', duration || '30 min']
    );
    const m = result.rows[0];
    res.status(201).json({
      id: m.id, employeeId: m.employee_id, employeeName: m.employee_name,
      employeeDept: m.employee_dept, meetingType: m.meeting_type, date: m.date,
      time: m.time, duration: m.duration, aiStatus: m.ai_status,
    });
  } catch (error) {
    logger.error('Failed to create meeting', { error: error.message });
    res.status(500).json({ message: 'Failed to create meeting' });
  }
});

// --- Commitments ---
app.get('/api/commitments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM commitments ORDER BY due_date ASC');
    res.json(result.rows.map(c => ({
      id: c.id, employeeId: c.employee_id, employeeName: c.employee_name,
      text: c.text, dueDate: c.due_date, sourceMeteting: c.source_meeting,
      sourceMeetingDate: c.source_meeting_date, status: c.status,
      resolved: c.resolved, assignedHrbp: c.assigned_hrbp, createdDaysAgo: c.created_days_ago,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch commitments' });
  }
});

app.post('/api/commitments/:id/resolve', async (req, res) => {
  try {
    await db.query("UPDATE commitments SET resolved = true, status = 'resolved' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Commitment resolved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resolve commitment' });
  }
});

app.post('/api/commitments/:id/unresolve', async (req, res) => {
  try {
    await db.query("UPDATE commitments SET resolved = false, status = 'on_track' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Commitment unresolved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unresolve commitment' });
  }
});



// --- Departments ---
app.get('/api/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows.map(d => ({
      id: d.id, name: d.name, employeeCount: d.employee_count,
      engagementScore: d.engagement_score, sentimentStatus: d.sentiment_status,
      delta: d.delta, hrbpAssigned: d.hrbp_assigned, meetingsLast30d: d.meetings_last_30d,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

app.get('/api/departments/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Department not found' });
    const d = result.rows[0];
    res.json({
      id: d.id, name: d.name, employeeCount: d.employee_count,
      engagementScore: d.engagement_score, sentimentStatus: d.sentiment_status,
      delta: d.delta, hrbpAssigned: d.hrbp_assigned, meetingsLast30d: d.meetings_last_30d,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch department' });
  }
});

// --- Analytics ---
app.get('/api/analytics/sentiment', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT date, ROUND(AVG(score)) as avg_score
      FROM sentiment_history
      GROUP BY date ORDER BY date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sentiment trends' });
  }
});

app.get('/api/analytics/engagement', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT name, engagement_score, delta FROM departments ORDER BY engagement_score DESC
    `);
    res.json(result.rows.map(d => ({
      department: d.name, score: d.engagement_score, delta: d.delta,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch engagement data' });
  }
});

app.get('/api/analytics/risk-heatmap', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT department,
        COUNT(*) FILTER (WHERE risk_tier = 'critical') as critical,
        COUNT(*) FILTER (WHERE risk_tier = 'concern') as concern,
        COUNT(*) FILTER (WHERE risk_tier = 'watch') as watch,
        COUNT(*) FILTER (WHERE risk_tier = 'stable') as stable
      FROM employees GROUP BY department
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch risk heatmap' });
  }
});

app.get('/api/analytics/attrition', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT department, COUNT(*) as total,
        COUNT(*) FILTER (WHERE risk_tier IN ('critical', 'concern')) as at_risk
      FROM employees GROUP BY department
    `);
    res.json(result.rows.map(d => ({
      department: d.department, total: parseInt(d.total), atRisk: parseInt(d.at_risk),
      rate: d.total > 0 ? Math.round((d.at_risk / d.total) * 100) : 0,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch attrition data' });
  }
});

// --- HR Team ---
app.get('/api/hr-team', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM hr_team ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch HR team' });
  }
});

app.post('/api/hr-team', async (req, res) => {
  try {
    const { name, email, role, department } = req.body;
    const result = await db.query(
      'INSERT INTO hr_team (name, email, role, department) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, role, department]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add HR team member' });
  }
});

// --- Activities ---
app.get('/api/activities', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 20');
    res.json(result.rows.map(a => ({
      id: a.id, type: a.type, description: a.description,
      employeeName: a.employee_name, actedBy: a.acted_by, timestamp: a.timestamp,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

/* ============================================ */
/*  LEGACY ENDPOINTS (backward compatibility)   */
/* ============================================ */

// Zoho OAuth endpoints (for initial token generation)
app.get('/auth/zoho', (req, res) => {
  const url =
    'https://accounts.zoho.in/oauth/v2/auth?' +
    'scope=ZohoPeople.employee.ALL,ZohoPeople.forms.ALL&' +
    `client_id=${process.env.ZOHO_CLIENT_ID}&` +
    'response_type=code&' +
    `redirect_uri=http://localhost:5000/auth/zoho/callback&` +
    'access_type=offline';
  res.redirect(url);
});

app.get('/auth/zoho/callback', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        redirect_uri: 'http://localhost:5000/auth/zoho/callback',
        code: req.query.code,
      },
    });
    logger.info('Zoho tokens received', { hasRefresh: !!response.data.refresh_token });
    res.send('Zoho authorization successful. Check terminal for tokens.');
  } catch (err) {
    logger.error('Zoho callback failed', { error: err.response?.data || err.message });
    res.send('Zoho authorization failed.');
  }
});

// Google OAuth endpoints (for initial token generation)
app.get('/auth/google', (req, res) => {
  const { google } = require('googleapis');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:5000/auth/google/callback'
  );
  const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: ['https://www.googleapis.com/auth/gmail.readonly'] });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:5000/auth/google/callback'
    );
    const { tokens } = await oauth2Client.getToken(req.query.code);
    logger.info('Google tokens received', { hasRefresh: !!tokens.refresh_token });
    res.send('Google authorization successful. Check terminal for refresh token.');
  } catch (err) {
    logger.error('Google callback failed', { error: err.message });
    res.send('Google authorization failed.');
  }
});

/* ============================================ */
/*  HEALTH CHECK                                */
/* ============================================ */

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ============================================ */
/*  ERROR HANDLING                              */
/* ============================================ */

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ message: 'Internal server error' });
});

/* ============================================ */
/*  WEBSOCKET SERVER                            */
/* ============================================ */

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      logger.debug('WebSocket message received', { type: msg.type });
    } catch {
      // ignore invalid messages
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });
});

// Broadcast function for real-time updates
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Dashboard auto-refresh interval (60 seconds)
setInterval(() => {
  broadcast('refresh', { message: 'Dashboard refresh' });
}, 60000);

/* ============================================ */
/*  START SERVER                                */
/* ============================================ */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info('API endpoints available:');
  logger.info('  POST /api/auth/login, /api/auth/register');
  logger.info('  GET  /api/employees, /api/employees/:id');
  logger.info('  POST /api/transcripts/upload');
  logger.info('  POST /api/ai/chat');
  logger.info('  GET  /api/notifications');
  logger.info('  GET  /api/risk-analysis');
  logger.info('  GET  /api/health');
});

// Initialize Pinecone connection (non-blocking)
chromaService.init().catch(() => {
  logger.warn('Pinecone not available - AI memory features will be limited');
});

module.exports = { app, server, broadcast };
