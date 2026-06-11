const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const providerRoutes = require('./routes/provider.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

const path = require('path');
const sharedPath = process.env.SHARED_MODULES_PATH || path.resolve(__dirname, '../..', 'shared');
const { pool } = require(path.join(sharedPath, 'database'));

const app = express();
const PORT = process.env.PORT || 3010;

const initConnections = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[PROVIDERS] PostgreSQL conectado');
  } catch (err) {
    console.error('[PROVIDERS] PostgreSQL error:', err.message);
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
    res.status(200).json({ status: 'OK', service: 'providers-service', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', service: 'providers-service', db: err.message });
  }
});

app.use('/suppliers', providerRoutes);
app.use('/purchases', purchaseRoutes);

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Providers Service running on port ${PORT}`);
});

module.exports = app;
