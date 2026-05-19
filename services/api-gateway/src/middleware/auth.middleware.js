/**
 * ============================================================
 * AUTH MIDDLEWARE - API GATEWAY
 * ============================================================
 * Valida JWT en las rutas protegidas del gateway.
 * Si el token es valido, inyecta req.user y reenvia al servicio.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'confimax_secret_key';

// Rutas publicas que no requieren auth (login, register, health)
const PUBLIC_PATHS = [
  /^\/api\/auth\/login/,
  /^\/api\/auth\/register/,
  /^\/api\/auth\/refresh/,
  /^\/health/,
];

function isPublicPath(path) {
  return PUBLIC_PATHS.some((regex) => regex.test(path));
}

const authenticateGateway = (req, res, next) => {
  // Saltar auth para rutas publicas (verificando path relativo y original)
  if (isPublicPath(req.path) || isPublicPath(req.originalUrl)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    // Inyectar user_id en headers para los microservicios
    req.headers['x-user-id'] = decoded.id || decoded.userId || '';
    req.headers['x-user-role'] = decoded.role || '';
    next();
  } catch (err) {
    console.error('[GATEWAY] JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = {
  authenticateGateway,
};
