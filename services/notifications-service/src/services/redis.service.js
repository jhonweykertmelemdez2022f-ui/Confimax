const { createClient } = require('redis');
const config = require('../config');

let redisClient = null;

const connectRedis = async () => {
  try {
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

    console.log(`[REDIS] Attempting connection to: ${config.redis.url || config.redis.host}`);
    await redisClient.connect();
    console.log('[REDIS] Successfully connected to Upstash/Redis!');
    return redisClient;
  } catch (error) {
    console.error('[REDIS] CRITICAL CONNECTION ERROR:', error.message);
    return null;
  }
};

const getRedisClient = () => redisClient;

const messageQueue = {
  async publish(channel, message) {
    if (!redisClient) return;
    await redisClient.publish(channel, JSON.stringify(message));
  },

  async subscribe(channel, callback) {
    if (!redisClient) return;
    const subscriber = redisClient.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      callback(JSON.parse(message));
    });
    return subscriber;
  },

  async addToQueue(queueName, message) {
    if (!redisClient) return;
    await redisClient.lPush(queueName, JSON.stringify(message));
  },

  async popFromQueue(queueName) {
    if (!redisClient) return null;
    const data = await redisClient.rPop(queueName);
    return data ? JSON.parse(data) : null;
  },
};

module.exports = {
  connectRedis,
  getRedisClient,
  messageQueue,
};
