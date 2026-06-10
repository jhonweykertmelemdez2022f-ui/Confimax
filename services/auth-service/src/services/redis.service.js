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

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('[AUTH] Connected to Redis/Upstash'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('[AUTH] Failed to connect to Redis:', error.message);
    return null;
  }
};

const getRedisClient = () => redisClient;

const messageQueue = {
  async get(key) {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  async publish(channel, message) {
    if (!redisClient) {
      console.error(`[REDIS] Cannot publish to ${channel}: Not connected`);
      return;
    }
    await redisClient.publish(channel, JSON.stringify(message));
    console.log(`[REDIS] Message published to ${channel}: ${message.action}`);
  },

  async set(key, value, ttl = 3600) {
    if (!redisClient) return;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  },

  async del(key) {
    if (!redisClient) return;
    await redisClient.del(key);
  },

  async incr(key) {
    if (!redisClient) return 0;
    return await redisClient.incr(key);
  },

  async expire(key, ttl) {
    if (!redisClient) return;
    await redisClient.expire(key, ttl);
  },

  async ttl(key) {
    if (!redisClient) return -1;
    return await redisClient.ttl(key);
  },
};

module.exports = {
  connectRedis,
  getRedisClient,
  messageQueue,
};
