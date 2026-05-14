const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const customerRoutes = require('./routes/customer.routes');
const creditRoutes = require('./routes/credit.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

// Conexiones cloud
const sharedPath = process.env.SHARED_MODULES_PATH || '../../shared';
const { pool } = require(sharedPath + '/database');
const { connectUpstash } = require(sharedPath + '/upstash-redis');

const app = express();
const PORT = process.env.PORT || 3004;

// Inicializar conexiones cloud
const initConnections = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[CUSTOMERS] PostgreSQL conectado');
  } catch (err) {
    console.error('[CUSTOMERS] PostgreSQL error:', err.message);
  }
  try {
    await connectUpstash();
    console.log('[CUSTOMERS] Redis/Upstash conectado');
  } catch (err) {
    console.error('[CUSTOMERS] Redis error:', err.message);
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
    res.status(200).json({ status: 'OK', service: 'customers-service', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', service: 'customers-service', db: err.message });
  }
});

app.use('/customers', customerRoutes);
app.use('/credits', creditRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Customers Service running on port ${PORT}`);
});

module.exports = app;
