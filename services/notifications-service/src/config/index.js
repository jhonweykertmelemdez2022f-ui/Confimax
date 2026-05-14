module.exports = {
  port: process.env.PORT || 3005,
  mongo: {
    // Soporte Atlas: usa ATLAS_URI si existe, luego MONGODB_URI / MONGO_URL
    uri: process.env.ATLAS_URI || process.env.MONGODB_URI || process.env.MONGO_URL || null,
    host: process.env.ATLAS_HOST || process.env.MONGO_HOST || 'localhost',
    port: process.env.ATLAS_PORT || process.env.MONGO_PORT || 27017,
    database: process.env.ATLAS_DB || process.env.MONGO_DB || 'confimax_logs',
    user: process.env.ATLAS_USER || process.env.MONGO_USER || '',
    password: process.env.ATLAS_PASSWORD || process.env.MONGO_PASSWORD || '',
    authSource: process.env.ATLAS_AUTH_SOURCE || 'admin',
  },
  redis: {
    // Soporte Upstash: usa UPSTASH_REDIS_URL si existe, luego REDIS_URL
    url: process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || null,
    host: process.env.UPSTASH_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: process.env.UPSTASH_REDIS_PORT || process.env.REDIS_PORT || 6379,
    password: process.env.UPSTASH_REDIS_PASSWORD || process.env.REDIS_PASSWORD || 'Jackson1',
  },
  notifications: {
    stockWarningThreshold: 10,
    creditWarningDays: 7,
    expirationWarningDays: 30,
  },
};
