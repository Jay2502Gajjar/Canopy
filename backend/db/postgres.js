const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('connect', () => {
  logger.info('PostgreSQL pool connected');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a query against PostgreSQL
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text: text.substring(0, 80), duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query failed', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
}

/**
 * Get a single client from the pool for transactions
 */
async function getClient() {
  return pool.connect();
}

/**
 * Initialize the database with schema
 */
async function initDB() {
  const fs = require('fs');
  const path = require('path');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema', { error: error.message });
    throw error;
  }
}

module.exports = { query, getClient, pool, initDB };
