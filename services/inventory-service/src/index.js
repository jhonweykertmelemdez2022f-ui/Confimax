const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const stockRoutes = require('./routes/stock.routes');
const stockMovementRoutes = require('./routes/stock-movement.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

// Conexiones cloud
const sharedPath = process.env.SHARED_MODULES_PATH || '../../shared';
const { pool } = require(sharedPath + '/database');
const { connectUpstash } = require(sharedPath + '/upstash-redis');

const app = express();
const PORT = process.env.PORT || 3002;

// Inicializar conexiones cloud
const initConnections = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[INVENTORY] PostgreSQL conectado');
  } catch (err) {
    console.error('[INVENTORY] PostgreSQL error:', err.message);
  }
  try {
    await connectUpstash();
    console.log('[INVENTORY] Redis/Upstash conectado');
  } catch (err) {
    console.error('[INVENTORY] Redis error:', err.message);
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
    res.status(200).json({ status: 'OK', service: 'inventory-service', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', service: 'inventory-service', db: err.message });
  }
});

app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/stock', stockRoutes);
app.use('/stock-movements', stockMovementRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Inventory Service running on port ${PORT}`);
});

module.exports = app;
