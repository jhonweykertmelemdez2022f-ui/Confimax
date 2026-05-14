const path = require('path');
const sharedPath = process.env.SHARED_MODULES_PATH || path.resolve(__dirname, '../../../shared');

module.exports = {
  port: process.env.PORT || 3006,
  jwtSecret: process.env.JWT_SECRET || 'confimax_secret_key',
  jwtExpiration: process.env.JWT_EXPIRATION || '8h',
  bcrypt: { saltRounds: 10 },
  db: {
    url: process.env.DATABASE_URL || null,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'confimax',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'confimax',
    ssl: (process.env.POSTGRES_HOST || '').includes('supabase.co') || process.env.POSTGRES_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  },
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  mongo: {
    uri: process.env.MONGO_URL || process.env.MONGODB_URI || null,
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT) || 27017,
    user: process.env.MONGO_USER || '',
    password: process.env.MONGO_PASSWORD || '',
    database: process.env.MONGO_DB || 'confimax_notifications',
  },
  sharedPath,
};
