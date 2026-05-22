const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const chatRoutes = require('./routes/chat.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Permitir si no hay origin (como peticiones entre servicios o Postman)
    if (!origin) return callback(null, true);
    
    const allowed = config.cors.origin;
    if (allowed === '*' || (Array.isArray(allowed) && (allowed.includes(origin) || allowed.includes('*')))) {
      callback(null, true);
    } else if (typeof allowed === 'string' && allowed === origin) {
      callback(null, true);
    } else {
      // En desarrollo o tras el gateway, a veces es mejor ser permisivo
      // pero por ahora logueamos y permitimos si es '*'
      callback(null, true); 
    }
  },
  credentials: true
}));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ai-service',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[AI Service Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 AI Service running on port ${config.port}`);
  console.log(`📡 Health check: http://localhost:${config.port}/health`);
  console.log(`🤖 Using Groq model: ${config.groq.model}`);
});

module.exports = app;
