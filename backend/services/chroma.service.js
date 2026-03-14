const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../utils/logger');

let pinecone = null;
let index = null;

const INDEX_NAME = process.env.PINECONE_INDEX || 'canopy-hr';

/**
 * Initialize Pinecone connection
 */
async function init() {
  try {
    if (!process.env.PINECONE_API_KEY) {
      logger.warn('PINECONE_API_KEY not set — AI memory features disabled');
      return null;
    }

    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    index = pinecone.index(INDEX_NAME);
    logger.info('Pinecone initialized', { index: INDEX_NAME });
    return index;
  } catch (error) {
    logger.warn('Pinecone initialization failed — running without vector memory', { error: error.message });
    return null;
  }
}

/**
 * Generate a simple numeric vector from text (lightweight embedding)
 * In production, use an embedding model (OpenAI, Cohere, etc.)
 * This creates a deterministic 384-dim vector from the text for demo purposes.
 */
function textToVector(text, dimensions = 384) {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = (charCode * (i + 1)) % dimensions;
    vector[idx] += 1.0 / (1 + Math.floor(i / dimensions));
  }
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / magnitude);
}

/**
 * Add a memory document to Pinecone
 */
async function addMemory(id, document, metadata = {}) {
  try {
    if (!index) await init();
    if (!index) return null;

    const vector = textToVector(document);

    await index.upsert([
      {
        id,
        values: vector,
        metadata: {
          ...metadata,
          text: document.substring(0, 1000), // Pinecone metadata has size limits
        },
      },
    ]);

    logger.info('Memory added to Pinecone', { id, type: metadata.type });
    return true;
  } catch (error) {
    logger.error('Failed to add memory to Pinecone', { error: error.message });
    return null;
  }
}

/**
 * Search Pinecone for relevant memories
 */
async function searchMemory(queryText, topK = 5, filter = null) {
  try {
    if (!index) await init();
    if (!index) return [];

    const vector = textToVector(queryText);

    const queryParams = {
      vector,
      topK,
      includeMetadata: true,
    };

    if (filter) {
      queryParams.filter = filter;
    }

    const results = await index.query(queryParams);

    return (results.matches || []).map(match => ({
      document: match.metadata?.text || '',
      metadata: match.metadata || {},
      score: match.score || 0,
    }));
  } catch (error) {
    logger.error('Pinecone search failed', { error: error.message });
    return [];
  }
}

/**
 * Get all context for a specific employee
 */
async function getEmployeeContext(employeeId) {
  try {
    if (!index) await init();
    if (!index) return [];

    const vector = textToVector('employee context overview');

    const results = await index.query({
      vector,
      topK: 20,
      includeMetadata: true,
      filter: { employee_id: { $eq: employeeId } },
    });

    return (results.matches || []).map(match => ({
      document: match.metadata?.text || '',
      metadata: match.metadata || {},
    }));
  } catch (error) {
    logger.error('Failed to get employee context from Pinecone', { error: error.message });
    return [];
  }
}

/**
 * Delete a specific memory by ID
 */
async function deleteMemory(id) {
  try {
    if (!index) await init();
    if (!index) return null;

    await index.deleteOne(id);
    logger.info('Memory deleted from Pinecone', { id });
    return true;
  } catch (error) {
    logger.error('Failed to delete memory from Pinecone', { error: error.message });
    return null;
  }
}

/**
 * Delete all memories for a specific employee
 */
async function deleteEmployeeMemory(employeeId) {
  try {
    if (!index) await init();
    if (!index) return null;

    await index.deleteMany({
      filter: { employee_id: { $eq: employeeId } }
    });
    logger.info('Employee memories deleted from Pinecone', { employeeId });
    return true;
  } catch (error) {
    logger.error('Failed to delete employee memories from Pinecone', { error: error.message });
    return null;
  }
}

module.exports = { init, addMemory, searchMemory, getEmployeeContext, deleteMemory, deleteEmployeeMemory };
