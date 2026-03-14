const db = require('../db/postgres');
const groqService = require('../services/groq.service');
const chromaService = require('../services/chroma.service');
const activityService = require('../services/activity.service');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/transcripts/upload — Upload and analyze a transcript
 */
async function upload(req, res) {
  try {
    const { employeeId, employeeName, employeeDept, meetingType, date, duration, content } = req.body;

    if (!employeeId || !content) {
      return res.status(400).json({ message: 'employeeId and content are required' });
    }

    // Convert content array to transcript text for analysis
    let transcriptText = '';
    if (Array.isArray(content)) {
      transcriptText = content.map(line => `${line.speaker}: ${line.text}`).join('\n');
    } else if (typeof content === 'string') {
      transcriptText = content;
    }

    // Analyze with Groq
    let aiAnalysis = null;
    let aiStatus = 'pending';
    try {
      aiAnalysis = await groqService.analyzeTranscript(transcriptText);
      aiStatus = 'analysed';
    } catch (err) {
      logger.warn('Transcript analysis failed, saving without analysis', { error: err.message });
    }

    // Store in PostgreSQL
    const result = await db.query(
      `INSERT INTO transcripts (employee_id, employee_name, employee_dept, meeting_type, date, duration, ai_status, content, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [employeeId, employeeName, employeeDept, meetingType, date || new Date(), duration, aiStatus, JSON.stringify(content), aiAnalysis ? JSON.stringify(aiAnalysis) : null]
    );

    // Extract and store commitments from AI analysis
    if (aiAnalysis?.actionItems) {
      for (const item of aiAnalysis.actionItems) {
        await db.query(
          `INSERT INTO commitments (employee_id, employee_name, text, source_meeting, source_meeting_date, status)
           VALUES ($1, $2, $3, $4, $5, 'on_track')`,
          [employeeId, employeeName, item, meetingType, date || new Date()]
        );
      }
    }

    // Update employee sentiment from analysis
    if (aiAnalysis?.sentimentScore) {
      await db.query(
        `UPDATE employees SET sentiment_score = $1, updated_at = NOW() WHERE id = $2`,
        [aiAnalysis.sentimentScore, employeeId]
      );
      await db.query(
        `INSERT INTO sentiment_history (employee_id, date, score) VALUES ($1, $2, $3)`,
        [employeeId, date || new Date(), aiAnalysis.sentimentScore]
      );
    }

    // Store in ChromaDB for vector memory
    try {
      const memoryId = `transcript-${result.rows[0].id}`;
      await chromaService.addMemory(memoryId, transcriptText, {
        type: 'transcript',
        employee_id: employeeId,
        employee_name: employeeName || '',
        meeting_type: meetingType || '',
        date: date || new Date().toISOString(),
      });
    } catch (err) {
      logger.warn('Failed to store transcript in ChromaDB', { error: err.message });
    }

    // Log the recent change
    await activityService.logEvent({
      eventType: 'profile_update',
      description: `New ${meetingType || 'meeting'} transcript uploaded and analyzed`,
      employeeId,
      employeeName
    });

    const transcript = formatTranscript(result.rows[0]);
    logger.info('Transcript uploaded and processed', { employeeId, aiStatus });
    res.status(201).json(transcript);
  } catch (error) {
    logger.error('Transcript upload failed', { error: error.message });
    res.status(500).json({ message: 'Transcript upload failed' });
  }
}

/**
 * GET /api/transcripts/:employeeId — Get transcripts for an employee
 */
async function getByEmployee(req, res) {
  try {
    const { employeeId } = req.params;

    const result = await db.query(
      `SELECT * FROM transcripts WHERE employee_id = $1 ORDER BY date DESC`,
      [employeeId]
    );

    res.json(result.rows.map(formatTranscript));
  } catch (error) {
    logger.error('Failed to fetch transcripts', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch transcripts' });
  }
}

/**
 * GET /api/transcripts — Get all transcripts
 */
async function getAll(req, res) {
  try {
    const result = await db.query('SELECT * FROM transcripts ORDER BY date DESC');
    res.json(result.rows.map(formatTranscript));
  } catch (error) {
    logger.error('Failed to fetch transcripts', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch transcripts' });
  }
}

/**
 * Format transcript row to match frontend Transcript type
 */
function formatTranscript(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeDept: row.employee_dept,
    meetingType: row.meeting_type,
    date: row.date,
    duration: row.duration,
    aiStatus: row.ai_status,
    content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
    aiAnalysis: typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis,
  };
}

module.exports = { upload, getByEmployee, getAll };
