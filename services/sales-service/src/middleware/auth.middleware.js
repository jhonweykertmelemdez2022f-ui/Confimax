const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'confimax_secret_key';

const authenticate = async (req, res, next) => {
  try {
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

    let userRoles = [];
    if (typeof req.user.role === 'string') {
      userRoles = [req.user.role];
    } else if (Array.isArray(req.user.role)) {
      userRoles = req.user.role;
    } else {
      return res.status(403).json({ message: 'Insufficient permissions: Invalid role format' });
    }

    const hasPermission = userRoles.some(userRole => roles.includes(userRole));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
