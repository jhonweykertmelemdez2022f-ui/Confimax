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
      console.log('[BACKEND] Permission denied:', { userRole: req.user.role, allowedRoles: roles, userRoles });
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };