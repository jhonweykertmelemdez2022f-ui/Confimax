const { RateLimiterMemory } = require('rate-limiter-flexible');

const limiter = new RateLimiterMemory({ points: 30, duration: 1 });

const rateLimiter = (req, res, next) => {
  limiter.consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).json({ message: 'Too many requests' }));
};

module.exports = { rateLimiter };
