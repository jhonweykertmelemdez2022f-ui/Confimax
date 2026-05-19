/**
 * ============================================================
 * API GATEWAY - CONFIMAX
 * ============================================================
 * Punto de entrada unico para todos los microservicios.
 * Proxy inverso con rate limiting, CORS, Helmet y validacion JWT.
 *
 * Rutas:
 *   /api/auth/*      -> auth-service:3001
 *   /api/inventory/* -> inventory-service:3002
 *   /api/sales/*     -> sales-service:3003
 *   /api/customers/* -> customers-service:3004
 *   /api/notifications/* -> notifications-service:3005
 *   /health          -> Health check del gateway
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const { authenticateGateway } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.GATEWAY_PORT || process.env.PORT || 8080;

// ============================================================
// CONFIGURACION DE SERVICIOS DESTINO
// ============================================================
const SERVICES = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    pathRewrite: { '^/api/auth': '/auth' }, // Conservar el prefijo /auth para mapear correctamente
    changeOrigin: true,
  },
  inventory: {
    target: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002',
    pathRewrite: { '^/api/inventory': '' },
    changeOrigin: true,
  },
  sales: {
    target: process.env.SALES_SERVICE_URL || 'http://sales-service:3003',
    pathRewrite: { '^/api/sales': '' },
    changeOrigin: true,
  },
  customers: {
    target: process.env.CUSTOMERS_SERVICE_URL || 'http://customers-service:3004',
    pathRewrite: { '^/api/customers': '' },
    changeOrigin: true,
  },
  notifications: {
    target: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3005',
    pathRewrite: { '^/api/notifications': '' },
    changeOrigin: true,
  },
  backend: {
    target: process.env.BACKEND_SERVICE_URL || 'http://backend:3006',
    pathRewrite: { '^/api/backend': '/api' },
    changeOrigin: true,
  },
};

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting global
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  };
  res.status(200).json(health);
});

// ============================================================
// PROXY MIDDLEWARES
// ============================================================

// Helper para crear proxy con logs y manejo de errores
const createServiceProxy = (name, config) => {
  const proxy = createProxyMiddleware({
    ...config,
    onError: (err, req, res) => {
      console.error(`[GATEWAY] Proxy error [${name}]:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Bad Gateway',
          message: `Service ${name} is unavailable`,
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[GATEWAY] ${req.method} ${req.path} -> ${name}`);
      
      // RESTREAM BODY BUG FIX: Si el body ya fue analizado por express.json(), 
      // volver a serializar el payload en el stream original antes de enviarlo
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        // Ajustar content-length para reflejar el nuevo tamaño
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        // Escribir el body en el stream de destino
        proxyReq.write(bodyData);
      }
    },
  });
  return proxy;
};

// ============================================================
// PROXY ROUTING (Monolith Mode vs Microservices Mode)
// ============================================================
const MONOLITH_MODE = process.env.MONOLITH_MODE === 'true' || !!process.env.BACKEND_SERVICE_URL;

if (MONOLITH_MODE) {
  const backendTarget = process.env.BACKEND_SERVICE_URL || 'http://backend:3006';
  console.log(`[GATEWAY] 🚀 Running in MONOLITH MODE: Proxying all /api/* -> ${backendTarget}`);

  // Compatibilidad de rutas unificadas (/api/backend/audit -> /api/audit)
  app.use('/api/backend', authenticateGateway, createServiceProxy('backend-monolith-compat', {
    target: backendTarget,
    pathRewrite: { '^/api/backend': '/api' },
    changeOrigin: true,
  }));

  // Enrutar todo /api directamente al backend unificado (protegido por JWT en rutas privadas)
  app.use('/api', authenticateGateway, createServiceProxy('backend-monolith', {
    target: backendTarget,
    changeOrigin: true,
  }));
} else {
  console.log(`[GATEWAY] 🧩 Running in MICROSERVICES MODE`);

  // Auth service (login/register publicos, resto protegido)
  app.use('/api/auth', createServiceProxy('auth', SERVICES.auth));

  // Rutas Directas Compatibles con el Móvil (Mapeos Transparentes)
  app.use('/api/products', authenticateGateway, createServiceProxy('inventory', {
    target: SERVICES.inventory.target,
    pathRewrite: { '^/api/products': '/products' },
    changeOrigin: true,
  }));

  app.use('/api/sales', authenticateGateway, createServiceProxy('sales', {
    target: SERVICES.sales.target,
    pathRewrite: { '^/api/sales': '/sales' },
    changeOrigin: true,
  }));

  app.use('/api/customers', authenticateGateway, createServiceProxy('customers', {
    target: SERVICES.customers.target,
    pathRewrite: { '^/api/customers': '/customers' },
    changeOrigin: true,
  }));

  app.use('/api/notifications', authenticateGateway, createServiceProxy('notifications', {
    target: SERVICES.notifications.target,
    pathRewrite: { '^/api/notifications': '/notifications' },
    changeOrigin: true,
  }));

  // Backend unificado (protegido por JWT)
  app.use('/api/backend', authenticateGateway, createServiceProxy('backend', SERVICES.backend));

  // Servicios protegidos por JWT (Rutas con prefijos de Microservicio tradicionales)
  app.use('/api/inventory', authenticateGateway, createServiceProxy('inventory', SERVICES.inventory));
  app.use('/api/sales-legacy', authenticateGateway, createServiceProxy('sales', SERVICES.sales));
  app.use('/api/customers-legacy', authenticateGateway, createServiceProxy('customers', SERVICES.customers));
  app.use('/api/notifications-legacy', authenticateGateway, createServiceProxy('notifications', SERVICES.notifications));
}

// ============================================================
// RUTAS DIRECTAS A DASHBOARDS (sin rewrite)
// ============================================================
app.use('/dashboard/notifications', authenticateGateway, createProxyMiddleware({
  target: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3005',
  changeOrigin: true,
}));

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('[GATEWAY] Unhandled error:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  }
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[GATEWAY] API Gateway running on port ${PORT}`);
  console.log(`[GATEWAY] Mode: ${process.env.NODE_ENV || 'development'}`);
  Object.entries(SERVICES).forEach(([name, cfg]) => {
    console.log(`[GATEWAY] Route /api/${name} -> ${cfg.target}`);
  });
});

module.exports = app;
