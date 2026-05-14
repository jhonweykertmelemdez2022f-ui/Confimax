const { pool } = require('../models/index');
const config = require('../config');
const { checkUpstashHealth } = require(config.sharedPath + '/upstash-redis');
const { checkAtlasHealth } = require(config.sharedPath + '/mongo-atlas');

const healthController = {
  async status(req, res) {
    const result = { postgres: false, redis: false, mongo: false };
    try { await pool.query('SELECT 1'); result.postgres = true; } catch (e) { /* false */ }
    try { const h = await checkUpstashHealth(); result.redis = h.connected; } catch (e) { /* false */ }
    try { const h = await checkAtlasHealth(); result.mongo = h.connected; } catch (e) { /* false */ }
    const allHealthy = result.postgres && result.redis && result.mongo;
    res.status(allHealthy ? 200 : 503).json({
      service: 'backend',
      status: allHealthy ? 'OK' : 'DEGRADED',
      databases: {
        postgres: result.postgres ? 'connected' : 'error',
        redis: result.redis ? 'connected' : 'error',
        mongo: result.mongo ? 'connected' : 'error',
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  },

  async readiness(req, res) {
    const result = { postgres: false, redis: false, mongo: false };
    try { await pool.query('SELECT 1'); result.postgres = true; } catch (e) { }
    try { const h = await checkUpstashHealth(); result.redis = h.connected; } catch (e) { }
    try { const h = await checkAtlasHealth(); result.mongo = h.connected; } catch (e) { }
    const allHealthy = result.postgres && result.redis && result.mongo;
    res.status(allHealthy ? 200 : 503).json({ ready: allHealthy, details: result });
  },
};

module.exports = healthController;
