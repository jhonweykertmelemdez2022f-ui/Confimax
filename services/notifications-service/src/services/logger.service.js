/**
 * Logger Service - Guarda logs de auditoría en MongoDB Atlas
 */

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  context: {
    service: String,
    entity: String,
    userId: String,
  },
  level: { type: String, enum: ['INFO', 'WARN', 'ERROR'], default: 'INFO' },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ 'context.service': 1, timestamp: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

const logger = {
  Log: AuditLog,

  async audit(action, details = {}, context = {}) {
    try {
      const log = new AuditLog({
        action,
        details,
        context,
        level: 'INFO',
      });
      await log.save();
      console.log(`[AUDIT] ${action} - ${JSON.stringify(details).slice(0, 100)}`);
      return log;
    } catch (err) {
      console.error('[AUDIT] Error guardando log:', err.message);
      return null;
    }
  },

  async error(action, details = {}, context = {}) {
    try {
      const log = new AuditLog({
        action,
        details,
        context,
        level: 'ERROR',
      });
      await log.save();
      console.error(`[AUDIT ERROR] ${action}`);
      return log;
    } catch (err) {
      console.error('[AUDIT] Error guardando log:', err.message);
      return null;
    }
  },
};

module.exports = logger;
