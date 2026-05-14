const { createClient } = require('redis');
const config = require('../config');

let redisClient = null;

const connectRedis = async () => {
  try {
    // Soporte Upstash (URL rediss://) o Redis local
    const redisOptions = config.redis.url
      ? { url: config.redis.url }
      : {
          password: config.redis.password,
          socket: {
            host: config.redis.host,
            port: config.redis.port,
          },
        };

    redisClient = createClient(redisOptions);

    redisClient.on('error', (err) => console.error('[CUSTOMERS] Redis Client Error', err));
    redisClient.on('connect', () => console.log('[CUSTOMERS] Connected to Redis/Upstash'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('[CUSTOMERS] Failed to connect to Redis:', error.message);
    return null;
  }
};

const getRedisClient = () => redisClient;

const cacheService = {
  async get(key) {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttl = 3600) {
    if (!redisClient) return;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  },

  async del(key) {
    if (!redisClient) return;
    await redisClient.del(key);
  },

  async delPattern(pattern) {
    if (!redisClient) return;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  },
};

module.exports = {
  connectRedis,
  getRedisClient,
  cacheService,
};
