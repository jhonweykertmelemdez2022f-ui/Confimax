const config = require('../config');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: config.db.url,
  ssl: config.db.ssl,
});

const { connectUpstash, getUpstashClient } = require(config.sharedPath + '/upstash-redis');
const { connectAtlas, getMongoose } = require(config.sharedPath + '/mongo-atlas');

function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function initConnections() {
  try {
    await withTimeout(pool.query('SELECT 1'), 5000, 'PostgreSQL');
    console.log('[BACKEND] PostgreSQL conectado');
  } catch (err) {
    console.error('[BACKEND] PostgreSQL error:', err.message);
  }

  try {
    await withTimeout(connectUpstash(), 5000, 'Redis');
    console.log('[BACKEND] Redis conectado');
  } catch (err) {
    console.error('[BACKEND] Redis error:', err.message);
  }

  try {
    await withTimeout(connectAtlas(), 5000, 'MongoDB');
    console.log('[BACKEND] MongoDB conectado');
  } catch (err) {
    console.error('[BACKEND] MongoDB error:', err.message);
  }
}

module.exports = {
  pool,
  initConnections,
  getRedisClient: getUpstashClient,
  getMongoose,
};
