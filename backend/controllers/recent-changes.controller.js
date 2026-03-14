const db = require('../db/postgres');
const logger = require('../utils/logger');

exports.getRecentChanges = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await db.query(
      'SELECT * FROM recent_changes ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );

    const changes = result.rows.map(row => ({
      id: row.id,
      eventType: row.event_type,
      description: row.description,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      timestamp: row.timestamp
    }));

    res.json(changes);
  } catch (error) {
    logger.error('Failed to get recent changes', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};
