const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], config.jwtSecret);
    req.user = decoded;
    req.headers['x-user-id'] = decoded.id || decoded.userId || '';
    req.headers['x-user-role'] = decoded.role || '';
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

module.exports = { authenticate };
