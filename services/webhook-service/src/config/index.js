module.exports = {
  port: process.env.PORT || 3007,
  nodeEnv: process.env.NODE_ENV || 'development',
  webhookSecret: process.env.WEBHOOK_SECRET || 'confimax-webhook-secret-key',
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
  }
};