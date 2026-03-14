const db = require('../db/postgres');
const zohoService = require('../services/zoho.service');
const chromaService = require('../services/chroma.service');
const activityService = require('../services/activity.service');
const logger = require('../utils/logger');

/**
 * GET /api/employees — List all employees
 */
async function getAll(req, res) {
  try {
    const result = await db.query(`
      SELECT e.*,
        COALESCE(
          (SELECT json_agg(json_build_object('text', c.text, 'date', c.date, 'meetingRef', c.meeting_ref))
           FROM employee_concerns c WHERE c.employee_id = e.id), '[]'
        ) as concerns,
        COALESCE(
          (SELECT json_agg(json_build_object('date', sh.date, 'score', sh.score) ORDER BY sh.date)
           FROM sentiment_history sh WHERE sh.employee_id = e.id), '[]'
        ) as sentiment_history
      FROM employees e
      ORDER BY e.name ASC
    `);

    const employees = result.rows.map(formatEmployee);
    res.json(employees);
  } catch (error) {
    logger.error('Failed to fetch employees', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
}

/**
 * GET /api/employees/:id — Get employee by ID
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT e.*,
        COALESCE(
          (SELECT json_agg(json_build_object('text', c.text, 'date', c.date, 'meetingRef', c.meeting_ref))
           FROM employee_concerns c WHERE c.employee_id = e.id), '[]'
        ) as concerns,
        COALESCE(
          (SELECT json_agg(json_build_object('date', sh.date, 'score', sh.score) ORDER BY sh.date)
           FROM sentiment_history sh WHERE sh.employee_id = e.id), '[]'
        ) as sentiment_history
      FROM employees e
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(formatEmployee(result.rows[0]));
  } catch (error) {
    logger.error('Failed to fetch employee', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch employee' });
  }
}

/**
 * POST /api/employees — Create employee
 */
async function create(req, res) {
  try {
    const { name, email, role, department, employeeId, joinDate, reportingManager, employmentType } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Feature 7: Initial Sentiment Calculation
    const deptAvgResult = await db.query(
      'SELECT AVG(sentiment_score) as avg FROM employees WHERE department = $1',
      [department]
    );
    const initialSentiment = Math.round(deptAvgResult.rows[0].avg || 75);

    const result = await db.query(
      `INSERT INTO employees (name, email, role, department, employee_id, join_date, reporting_manager, employment_type, sentiment_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, email, role, department, employeeId, joinDate, reportingManager, employmentType || 'Full-time', initialSentiment]
    );

    const newEmployee = formatEmployee(result.rows[0]);

    // Feature 8: Zoho HRMS Backward Sync
    try {
      zohoService.createEmployee(req.body); // Fire and forget
    } catch (e) {
      logger.warn('Zoho backward sync failed', { email, error: e.message });
    }

    // Log to recent changes
    await activityService.logEvent({
      eventType: 'profile_update',
      description: `New employee profile created for ${name} (${department})`,
      employeeId: newEmployee.id,
      employeeName: name
    });

    logger.info('Employee created', { name, email, initialSentiment });
    res.status(201).json(newEmployee);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Employee with this email already exists' });
    }
    logger.error('Failed to create employee', { error: error.message });
    res.status(500).json({ message: 'Failed to create employee' });
  }
}

/**
 * PATCH /api/employees/:id — Update employee
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const fields = req.body;

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    const fieldMap = {
      name: 'name', email: 'email', role: 'role', department: 'department',
      sentimentScore: 'sentiment_score', sentimentTrend: 'sentiment_trend',
      memoryScore: 'memory_score', riskTier: 'risk_tier', lastInteraction: 'last_interaction',
      skills: 'skills', projects: 'projects', interests: 'interests',
      careerAspirations: 'career_aspirations', reportingManager: 'reporting_manager',
    };

    for (const [key, value] of Object.entries(fields)) {
      const dbField = fieldMap[key];
      if (dbField) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(formatEmployee(result.rows[0]));
  } catch (error) {
    logger.error('Failed to update employee', { error: error.message });
    res.status(500).json({ message: 'Failed to update employee' });
  }
}

/**
 * DELETE /api/employees/:id
 */
async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    
    // Get employee details before deletion for logging
    const empResult = await db.query('SELECT name FROM employees WHERE id = $1', [id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const employeeName = empResult.rows[0].name;

    // Delete from PostgreSQL (cascading deletes will handle transcript, notes, etc.)
    await db.query('DELETE FROM employees WHERE id = $1', [id]);

    // Delete from Pinecone (vector memory)
    try {
      await chromaService.deleteEmployeeMemory(id);
    } catch (e) {
      logger.warn('Failed to delete employee memory from Pinecone', { id, error: e.message });
    }

    // Log the event
    await activityService.logEvent({
      eventType: 'resignation_flagged', // Using existing frontend type for "removal/exit"
      description: `Employee profile for ${employeeName} has been deleted from the system.`,
      employeeId: null, // Employee is gone, but we track the name
      employeeName: employeeName
    });

    logger.info('Employee deleted completely', { id, name: employeeName });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    logger.error('Failed to delete employee', { error: error.message });
    res.status(500).json({ message: 'Failed to delete employee' });
  }
}

/**
 * GET /api/employees/:id/sentiment — Get sentiment history
 */
async function getSentiment(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT date, score FROM sentiment_history WHERE employee_id = $1 ORDER BY date ASC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch sentiment', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch sentiment' });
  }
}

/**
 * GET /api/employees/:id/notes — Get notes for an employee
 */
async function getNotes(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, employee_id, employee_name, content, preview, date, author, meeting_context, ai_highlights
       FROM notes WHERE employee_id = $1 ORDER BY date DESC`,
      [id]
    );

    const notes = result.rows.map(n => ({
      id: n.id,
      employeeId: n.employee_id,
      employeeName: n.employee_name,
      content: n.content,
      preview: n.preview,
      date: n.date,
      author: n.author,
      meetingContext: n.meeting_context,
      aiHighlights: n.ai_highlights || [],
    }));

    res.json(notes);
  } catch (error) {
    logger.error('Failed to fetch notes', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
}

/**
 * POST /api/employees/sync-hrms — Sync from Zoho HRMS
 */
async function syncHRMS(req, res) {
  try {
    const result = await zohoService.syncToPostgres(db);
    res.json({ message: 'HRMS sync complete', ...result });
  } catch (error) {
    logger.error('HRMS sync failed', { error: error.message });
    res.status(500).json({ message: 'HRMS sync failed' });
  }
}

/**
 * Format employee row from DB to API response (camelCase, matching frontend types)
 */
function formatEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    employeeId: row.employee_id,
    avatar: row.avatar || '',
    joinDate: row.join_date,
    tenure: row.tenure || '',
    reportingManager: row.reporting_manager,
    employmentType: row.employment_type,
    sentimentScore: row.sentiment_score,
    sentimentTrend: row.sentiment_trend,
    memoryScore: row.memory_score,
    riskTier: row.risk_tier,
    lastInteraction: row.last_interaction,
    skills: row.skills || [],
    projects: row.projects || [],
    interests: row.interests || [],
    careerAspirations: row.career_aspirations || [],
    concerns: row.concerns || [],
    sentimentHistory: row.sentiment_history || [],
  };
}

module.exports = { getAll, getById, create, update, deleteEmployee, getSentiment, getNotes, syncHRMS };
