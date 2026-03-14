const db = require('../db/postgres');
const logger = require('../utils/logger');

/**
 * Log an event to the recent_changes table
 * @param {Object} params
 * @param {string} params.eventType - type of event (e.g. 'employee created', 'note added')
 * @param {string} params.description - detailed description
 * @param {string} params.employeeId - PostgreSQL UUID of the employee
 * @param {string} params.employeeName - Name of the employee 
 */
async function logEvent({ eventType, description, employeeId, employeeName }) {
  try {
    await db.query(
      `INSERT INTO recent_changes (event_type, description, employee_id, employee_name) 
       VALUES ($1, $2, $3, $4)`,
      [eventType, description, employeeId, employeeName]
    );
    logger.info('Logged recent change', { eventType, employeeName });
  } catch (error) {
    logger.error('Failed to log recent change', { error: error.message });
  }
}

module.exports = { logEvent };
