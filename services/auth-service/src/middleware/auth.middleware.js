const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwtSecret);
    
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

    // Accept both old and new role formats - check all possible variations
    const userRoles = [
      req.user.role,
      req.user.role === 'cliente' ? 'customer' : null,
      req.user.role === 'customer' ? 'cliente' : null,
      req.user.role === 'vendedor' ? 'vendor' : null,
      req.user.role === 'vendor' ? 'vendedor' : null,
    ].filter(Boolean);

    // Check if any of the user's roles match any of the allowed roles
    const hasPermission = roles.some(allowedRole => 
      userRoles.some(userRole => userRole === allowedRole)
    );

    if (!hasPermission) {
      console.log('[AUTH] Permission denied:', { userRole: req.user.role, allowedRoles: roles, userRoles });
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
