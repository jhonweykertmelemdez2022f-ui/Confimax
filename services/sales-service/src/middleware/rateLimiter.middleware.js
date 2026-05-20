const config = require('../config');
const { getRedisClient } = require('../services/redis.service');

const rateLimiter = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  const key = `ratelimit:${ip}`;
  const redisClient = getRedisClient();

  if (!redisClient) {
    return next();
  }

  try {
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, 60);
    }

    res.setHeader('X-RateLimit-Limit', 1500);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, 1500 - current));

    if (current > 1500) {
      return res.status(429).json({
        message: 'Too many requests',
        error: true
      });
    }
  } catch (error) {
    console.error('Rate limiter error:', error);
  }

  next();
};

module.exports = {
  rateLimiter,
};
