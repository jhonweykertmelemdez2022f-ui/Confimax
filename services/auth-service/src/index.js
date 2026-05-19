const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

// Conexiones cloud
const sharedPath = process.env.SHARED_MODULES_PATH || '../../shared';
const { pool } = require(sharedPath + '/database');
const { connectUpstash } = require(sharedPath + '/upstash-redis');

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar conexiones cloud
const initConnections = async () => {
  try {
    // Verificar PostgreSQL (Supabase o local)
    await pool.query('SELECT 1');
    console.log('[AUTH] PostgreSQL conectado');
  } catch (err) {
    console.error('[AUTH] PostgreSQL error:', err.message);
  }

  try {
    // Conectar Upstash Redis (o local)
    await connectUpstash();
    console.log('[AUTH] Redis/Upstash conectado');
  } catch (err) {
    console.error('[AUTH] Redis error:', err.message);
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
    res.status(200).json({ status: 'OK', service: 'auth-service', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', service: 'auth-service', db: err.message });
  }
});

app.use('/auth', authRoutes);

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth Service running on port ${PORT}`);
});

module.exports = app;
