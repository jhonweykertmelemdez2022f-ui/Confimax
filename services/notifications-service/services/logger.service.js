const mongoose = require('mongoose');

// Esquema de Log
const LogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'AUDIT'],
    default: 'INFO'
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  userEmail: String,
  entity: {
    type: String,
    index: true
  },
  entityId: String,
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: String,
  userAgent: String,
  service: {
    type: String,
    default: 'confimax-api'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }
});

LogSchema.index({ userId: 1, timestamp: -1 });
LogSchema.index({ action: 1, timestamp: -1 });
LogSchema.index({ entity: 1, entityId: 1 });
LogSchema.index({ level: 1, timestamp: -1 });
LogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Log = mongoose.model('Log', LogSchema);

class LoggerService {
  constructor() {
    this.Log = Log;
  }
  
  async activity(action, details = {}, context = {}) {
    return this._save({ level: 'INFO', action, details, ...context });
  }
  
  async error(action, error, context = {}) {
    return this._save({
      level: 'ERROR',
      action,
      details: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        ...context.details
      },
      ...context
    });
  }
  
  async audit(action, details = {}, context = {}) {
    return this._save({ level: 'AUDIT', action, details, ...context });
  }
  
  async debug(action, details = {}, context = {}) {
    if (process.env.NODE_ENV === 'production') return;
    return this._save({ level: 'DEBUG', action, details, ...context });
  }
  
  async getUserLogs(userId, options = {}) {
    const { limit = 50, skip = 0, level } = options;
    const query = { userId };
    if (level) query.level = level;
    return this.Log.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean();
  }
  
  async getEntityLogs(entity, entityId, options = {}) {
    const { limit = 50 } = options;
    return this.Log.find({ entity, entityId }).sort({ timestamp: -1 }).limit(limit).lean();
  }
  
  async getActivityStats(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.Log.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 }, lastOccurrence: { $max: '$timestamp' } } },
      { $sort: { count: -1 } }
    ]);
  }
  
  async _save(data) {
    try {
      const log = new this.Log(data);
      await log.save();
      return log;
    } catch (err) {
      console.error('[LOGGER ERROR]', err.message, data);
      return null;
    }
  }
}

const logger = new LoggerService();

module.exports = logger;
module.exports.LoggerService = LoggerService;
