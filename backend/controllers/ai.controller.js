const db = require('../db/postgres');
const groqService = require('../services/groq.service');
const chromaService = require('../services/chroma.service');
const logger = require('../utils/logger');

/**
 * POST /api/ai/chat — AI assistant chat endpoint
 */
async function chat(req, res) {
  try {
    const { message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Gather employee data for AI context
    let employeeData = null;
    try {
      const empResult = await db.query(`
        SELECT e.id, e.name, e.department, e.role, e.sentiment_score, e.risk_tier,
               e.last_interaction, e.skills, e.projects, e.career_aspirations
        FROM employees e ORDER BY e.name
      `);
      employeeData = empResult.rows;
    } catch {
      logger.warn('Failed to fetch employee data for AI context');
    }

    // Search ChromaDB for relevant context
    let memoryContext = null;
    try {
      const memories = await chromaService.searchMemory(message, 5);
      if (memories.length > 0) {
        memoryContext = memories.map(m =>
          `[${m.metadata.type || 'context'}] ${m.document}`
        ).join('\n\n');
      }
    } catch {
      logger.warn('ChromaDB search failed for AI context');
    }

    // If a specific employee is referenced, get their full context
    if (context.employeeId) {
      try {
        const empDetail = await db.query('SELECT * FROM employees WHERE id = $1', [context.employeeId]);
        const transcripts = await db.query(
          'SELECT ai_analysis FROM transcripts WHERE employee_id = $1 ORDER BY date DESC LIMIT 3',
          [context.employeeId]
        );
        const notes = await db.query(
          'SELECT content, date FROM notes WHERE employee_id = $1 ORDER BY date DESC LIMIT 5',
          [context.employeeId]
        );
        const commitments = await db.query(
          'SELECT text, status, due_date FROM commitments WHERE employee_id = $1',
          [context.employeeId]
        );

        const empContext = {
          employee: empDetail.rows[0],
          recentTranscripts: transcripts.rows,
          notes: notes.rows,
          commitments: commitments.rows,
        };

        memoryContext = (memoryContext || '') + '\n\nSpecific Employee Context:\n' + JSON.stringify(empContext, null, 2);
      } catch {
        logger.warn('Failed to fetch specific employee context');
      }
    }

    // Also fetch department + commitment summaries for general queries
    let departmentData = null;
    try {
      const deptResult = await db.query('SELECT * FROM departments ORDER BY name');
      departmentData = deptResult.rows;
      if (departmentData.length > 0) {
        memoryContext = (memoryContext || '') + '\n\nDepartment Data:\n' + JSON.stringify(departmentData, null, 2);
      }
    } catch {
      // skip
    }

    // Get AI response with enriched context
    const response = await groqService.chat(message, context, employeeData, memoryContext);

    res.json({ response });
  } catch (error) {
    logger.error('AI chat failed', { error: error.message });
    res.status(500).json({ message: 'AI chat failed' });
  }
}

/**
 * POST /api/ai/employee — Get AI insights for an employee
 */
async function employeeInsight(req, res) {
  try {
    const { employee } = req.body;

    if (!employee) {
      return res.status(400).json({ message: 'Employee data is required' });
    }

    const insights = await groqService.employeeInsights(employee);
    res.json({ insights });
  } catch (error) {
    logger.error('Employee insight failed', { error: error.message });
    res.status(500).json({ message: 'AI insight failed' });
  }
}

/**
 * POST /api/ai/meeting-brief — Generate meeting preparation brief
 */
async function meetingBrief(req, res) {
  try {
    const employeeId = req.params.employeeId || req.body.employeeId;

    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required' });
    }

    const employee = await db.query('SELECT * FROM employees WHERE id = $1', [employeeId]);
    if (employee.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const transcripts = await db.query(
      'SELECT ai_analysis, date FROM transcripts WHERE employee_id = $1 ORDER BY date DESC LIMIT 3',
      [employeeId]
    );

    const notes = await db.query(
      'SELECT content, date, author FROM notes WHERE employee_id = $1 ORDER BY date DESC LIMIT 5',
      [employeeId]
    );

    const commitments = await db.query(
      'SELECT text, status, due_date FROM commitments WHERE employee_id = $1 AND resolved = false',
      [employeeId]
    );

    const brief = await groqService.generateMeetingBrief(
      employee.rows[0],
      transcripts.rows,
      notes.rows,
      commitments.rows
    );

    res.json({ brief });
  } catch (error) {
    logger.error('Meeting brief generation failed', { error: error.message });
    res.status(500).json({ message: 'Meeting brief generation failed' });
  }
}

module.exports = { chat, employeeInsight, meetingBrief };
