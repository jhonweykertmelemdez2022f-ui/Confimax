/**
 * ============================================================
 * REQUEST CONTEXT MIDDLEWARE
 * ============================================================
 * Extrae automáticamente del request: userId, username, IP,
 * endpoint y user-agent, y los expone al query wrapper para
 * enriquecer eventos de auditoría sin repetir código en cada
 * controlador.
 *
 * Uso en app principal:
 *   app.use(requestContextMiddleware);
 */

const { asyncLocalStorage } = require('../database/queryWrapper');

function requestContextMiddleware(req, res, next) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || req.ip || null;

  const ctx = {
    userId: req.user?.id || req.user?.sub || null,
    username: req.user?.username || req.user?.email || null,
    ip,
    endpoint: `${req.method} ${req.originalUrl}`,
    userAgent: req.headers['user-agent'] || null,
  };

  asyncLocalStorage.run(ctx, () => next());
}

module.exports = { requestContextMiddleware };
