const config = require('../config');
const { connectUpstash, getUpstashClient } = require(config.sharedPath + '/upstash-redis');

let connected = false;

async function connectRedis() {
  if (connected) return;
  await connectUpstash();
  connected = true;
}

function getRedisClient() {
  return getUpstashClient();
}

const messageQueue = {
  async set(key, value, ttl = 3600) {
    const client = getRedisClient();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await client.setEx(key, ttl, serialized);
  },

  async get(key) {
    const client = getRedisClient();
    const data = await client.get(key);
    try { return data ? JSON.parse(data) : null; } catch { return data; }
  },

  async del(key) {
    const client = getRedisClient();
    await client.del(key);
  },

  async incr(key) {
    const client = getRedisClient();
    return await client.incr(key);
  },

  async expire(key, ttl) {
    const client = getRedisClient();
    await client.expire(key, ttl);
  },

  async publish(channel, message) {
    const client = getRedisClient();
    await client.publish(channel, JSON.stringify(message));
  },
};

module.exports = { connectRedis, getRedisClient, messageQueue };
