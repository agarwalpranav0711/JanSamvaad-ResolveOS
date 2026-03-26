const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Database connection retry with 3 attempts (Reliability 3)
async function connectWithRetry(maxAttempts = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      logger.info({ attempt }, 'Database connected successfully');
      return;
    } catch (error) {
      logger.warn({ attempt, maxAttempts, err: error }, `Database connection attempt ${attempt}/${maxAttempts} failed`);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        logger.error('All database connection attempts exhausted — will retry on first query');
      }
    }
  }
}

// Fire-and-forget connection check on startup
connectWithRetry();

module.exports = pool;
