import mongoose from 'mongoose';

/**
 * Esquema de Logs en MongoDB
 * Almacena: actividad de usuarios, errores, auditoría
 */

const LogSchema = new mongoose.Schema({
  // Tipo de log
  level: {
    type: String,
    enum: ['debug', 'info', 'warn', 'error', 'fatal'],
    default: 'info',
    required: true,
    index: true
  },

  // Contexto del servicio
  service: {
    type: String,
    enum: ['auth', 'courses', 'enrollments', 'forum', 'api-gateway', 'system'],
    required: true,
    index: true
  },

  // Acción/operación realizada
  action: {
    type: String,
    required: true,
    index: true
  },

  // Usuario que realizó la acción (si aplica)
  userId: {
    type: String, // UUID de PostgreSQL como string
    index: true
  },

  // Información de la sesión
  session: {
    ip: String,
    userAgent: String,
    sessionId: String
  },

  // Detalles de la acción
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible para cualquier estructura
    default: {}
  },

  // Metadata adicional
  metadata: {
    requestId: String,
    correlationId: String,
    duration: Number, // ms
    statusCode: Number // para logs de API
  },

  // Información de error (solo para level: error/fatal)
  error: {
    message: String,
    stack: String,
    code: String
  },

  // Tags para búsqueda
  tags: [{
    type: String,
    index: true
  }],

  // Timestamp automático
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // Usamos timestamp personalizado
  collection: 'logs'
});

// Índices compuestos para búsquedas comunes
LogSchema.index({ service: 1, level: 1, timestamp: -1 });
LogSchema.index({ userId: 1, timestamp: -1 });
LogSchema.index({ action: 1, timestamp: -1 });
LogSchema.index({ 'error.code': 1, timestamp: -1 });
LogSchema.index({ tags: 1, timestamp: -1 });

// TTL: Eliminar logs antiguos después de 90 días (configurable)
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Métodos estáticos para logging común
LogSchema.statics.logAuth = function(userId, action, details, session) {
  return this.create({
    level: 'info',
    service: 'auth',
    action,
    userId,
    session,
    details,
    tags: ['auth', action]
  });
};

LogSchema.statics.logCourse = function(userId, action, courseId, details) {
  return this.create({
    level: 'info',
    service: 'courses',
    action,
    userId,
    details: { ...details, courseId },
    tags: ['course', action]
  });
};

LogSchema.statics.logError = function(service, error, context = {}) {
  return this.create({
    level: 'error',
    service,
    action: context.action || 'error',
    userId: context.userId,
    session: context.session,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN'
    },
    details: context.details || {},
    metadata: context.metadata || {},
    tags: ['error', service, error.code || 'unknown']
  });
};

LogSchema.statics.logEnrollment = function(userId, courseId, action, details) {
  return this.create({
    level: 'info',
    service: 'enrollments',
    action,
    userId,
    details: { ...details, courseId },
    tags: ['enrollment', action]
  });
};

LogSchema.statics.logForum = function(userId, action, topicId, details) {
  return this.create({
    level: 'info',
    service: 'forum',
    action,
    userId,
    details: { ...details, topicId },
    tags: ['forum', action]
  });
};

// Query helpers
LogSchema.query.byTimeRange = function(start, end) {
  return this.where('timestamp').gte(start).lte(end);
};

LogSchema.query.byUser = function(userId) {
  return this.where('userId', userId);
};

LogSchema.query.byService = function(service) {
  return this.where('service', service);
};

LogSchema.query.errorsOnly = function() {
  return this.where('level').in(['error', 'fatal']);
};

const Log = mongoose.model('Log', LogSchema);

export default Log;
