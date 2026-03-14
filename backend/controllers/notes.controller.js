const db = require('../db/postgres');
const logger = require('../utils/logger');
const activityService = require('../services/activity.service');
const chromaService = require('../services/chroma.service');

exports.getAllNotes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(result.rows.map(n => ({
      id: n.id,
      employeeId: n.employee_id,
      employeeName: n.employee_name,
      content: n.content,
      preview: n.preview,
      author: n.author,
      date: n.date,
      createdAt: n.created_at,
      meetingContext: n.meeting_context,
      aiHighlights: n.ai_highlights || []
    })));
  } catch (error) {
    logger.error('Failed to get all notes', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getNotesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await db.query(
      'SELECT * FROM notes WHERE employee_id = $1 ORDER BY created_at DESC',
      [employeeId]
    );

    res.json(result.rows.map(n => ({
      id: n.id,
      employeeId: n.employee_id,
      employeeName: n.employee_name,
      content: n.content,
      preview: n.preview,
      author: n.author,
      date: n.date, // the frontend expects 'date'
      createdAt: n.created_at,
      meetingContext: n.meeting_context,
      aiHighlights: n.ai_highlights || []
    })));
  } catch (error) {
    logger.error('Failed to get notes', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { employeeId, employeeName, author, noteText, content, meetingContext } = req.body;
    
    // Support frontend which might send 'content' vs 'noteText' or lacking name
    const actualContent = noteText || content;
    
    if (!employeeId || !actualContent || !author) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get employee name if not provided
    let empName = employeeName;
    if (!empName) {
      const empResult = await db.query('SELECT name FROM employees WHERE id = $1', [employeeId]);
      empName = empResult.rows.length > 0 ? empResult.rows[0].name : 'Unknown Employee';
    }

    const preview = actualContent.substring(0, 100) + (actualContent.length > 100 ? '...' : '');

    // Insert note
    const result = await db.query(
      `INSERT INTO notes (employee_id, employee_name, content, preview, author, meeting_context) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employeeId, empName, actualContent, preview, author, meetingContext]
    );

    const note = result.rows[0];

    // Store in Pinecone for AI memory
    try {
      await chromaService.addMemory(`note-${note.id}`, actualContent, {
        type: 'note', employee_id: employeeId, employee_name: empName, author: author,
      });
    } catch (e) {
      logger.error('Failed to add note to Pinecone embeddings', { error: e.message });
    }

    // Log the recent change
    await activityService.logEvent({
      eventType: 'manual note added',
      description: `New HR note added by ${author}`,
      employeeId,
      employeeName: empName
    });

    res.status(201).json({
      id: note.id,
      employeeId: note.employee_id,
      employeeName: note.employee_name,
      content: note.content,
      preview: note.preview,
      author: note.author,
      date: note.date,
      createdAt: note.created_at,
      meetingContext: note.meeting_context,
      aiHighlights: note.ai_highlights || []
    });
  } catch (error) {
    logger.error('Failed to add note', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = result.rows[0];

    // Remove from vector DB
    try {
      await chromaService.deleteMemory(`note-${id}`);
    } catch { /* optional */ }

    // Log the recent change
    await activityService.logEvent({
      eventType: 'manual note deleted',
      description: `HR note deleted by an administrator`,
      employeeId: note.employee_id,
      employeeName: note.employee_name
    });

    res.json({ message: 'Note deleted' });
  } catch (error) {
    logger.error('Failed to delete note', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};
