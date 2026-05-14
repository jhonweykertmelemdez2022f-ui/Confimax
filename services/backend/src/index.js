const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const config = require('./config');
const { initConnections } = require('./models');
const { connectRedis } = require('./services/redis.service');
const { setupAuditListeners } = require('./events/listeners/audit.listener');
const { requestContextMiddleware } = require('./middleware/context.middleware');
const routes = require('./routes');
const { errorHandler } = require('./middleware/error.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();
const PORT = config.port;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Middleware de contexto para capturar userId, IP, endpoint (antes de rutas)
app.use(requestContextMiddleware);

app.use('/api', routes);

app.use(errorHandler);

// Inicializar conexiones y listeners de auditoría
initConnections().then(() => {
  setupAuditListeners();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BACKEND] Running on port ${PORT}`);
    console.log(`[BACKEND] Health: http://0.0.0.0:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('[BACKEND] Failed to start:', err.message);
  process.exit(1);
});
