const jwt = require('jsonwebtoken');
const config = require('../config');

const JWT_SECRET = process.env.JWT_SECRET || config.jwtSecret || 'confimax_secret_key';

const authenticate = async (req, res, next) => {
  try {
    // Permitir llamadas internas entre microservicios
    const internalKey = req.headers['internal-service-key'];
    if (internalKey === (process.env.INTERNAL_SERVICE_KEY || 'confimax-internal')) {
      req.user = { id: '00000000-0000-0000-0000-000000000000', role: 'admin', name: 'System' };
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
