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

const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3000', 'https://confimax.vercel.app'];

app.use(helmet());
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Permisivo tras el gateway
    }
  }, 
  credentials: true 
}));
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
