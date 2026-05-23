const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/webhooks', webhookRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'webhook-service',
    timestamp: new Date().toISOString()
  });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 Webhook Service running on port ${config.port}`);
  console.log(`📡 Health check: http://localhost:${config.port}/health`);
  console.log(`🔗 Webhook endpoints: /webhooks/*`);
});