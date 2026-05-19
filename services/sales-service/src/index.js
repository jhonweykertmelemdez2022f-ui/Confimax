const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const saleRoutes = require('./routes/sale.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

// Conexiones cloud
const sharedPath = process.env.SHARED_MODULES_PATH || '../../shared';
const { pool } = require(sharedPath + '/database');
const { connectUpstash } = require(sharedPath + '/upstash-redis');

const app = express();
const PORT = process.env.PORT || 3003;

// Inicializar conexiones cloud
const initConnections = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[SALES] PostgreSQL conectado');
  } catch (err) {
    console.error('[SALES] PostgreSQL error:', err.message);
  }
  try {
    await connectUpstash();
    console.log('[SALES] Redis/Upstash conectado');
  } catch (err) {
    console.error('[SALES] Redis error:', err.message);
  }
};

initConnections();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimiter);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'OK', service: 'sales-service', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', service: 'sales-service', db: err.message });
  }
});

app.use('/sales', saleRoutes);

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sales Service running on port ${PORT}`);
});

module.exports = app;
