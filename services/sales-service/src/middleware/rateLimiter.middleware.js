const config = require('../config');
const { messageQueue } = require('../services/redis.service');

const rateLimiter = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `ratelimit:${ip}`;

  try {
    const current = await messageQueue.incr(key);

    if (current === 1) {
      await messageQueue.expire(key, 60);
    }

    res.setHeader('X-RateLimit-Limit', 100);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, 100 - current));

    if (current > 100) {
      return res.status(429).json({
        message: 'Too many requests',
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
