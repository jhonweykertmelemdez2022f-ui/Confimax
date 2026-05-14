const { AuditLog } = require('../models/audit.model');

const AuditService = {
  /**
   * Log genérico compatible con el nuevo schema.
   * Para operaciones manuales (login, logout, register).
   */
  async log({ operation, userId, username, entity, recordId, oldData, newData, ipAddress, endpoint, userAgent, status = 'success', errorMessage }) {
    try {
      await AuditLog.create({
        operation,
        userId,
        username,
        entity: entity || 'system',
        recordId,
        oldData,
        newData,
        ipAddress,
        endpoint,
        userAgent,
        status,
        errorMessage,
      });
    } catch (err) {
      console.error('[AUDIT] Error logging action:', err.message);
    }
  },

  async logLogin(userId, username, ipAddress, userAgent, status = 'success', errorMessage = null) {
    return this.log({
      operation: 'LOGIN',
      userId,
      username,
      entity: 'auth',
      ipAddress,
      userAgent,
      status,
      errorMessage,
    });
  },

  async logLogout(userId, username, ipAddress) {
    return this.log({
      operation: 'LOGOUT',
      userId,
      username,
      entity: 'auth',
      ipAddress,
    });
  },

  async logRegister(userId, username, ipAddress, userAgent) {
    return this.log({
      operation: 'REGISTER',
      userId,
      username,
      entity: 'auth',
      ipAddress,
      userAgent,
    });
  },

  async getLogs(filters = {}, limit = 100, offset = 0) {
    const { operation, userId, entity, recordId, start_date, end_date } = filters;
    const query = {};

    if (operation) query.operation = operation;
    if (userId) query.userId = userId;
    if (entity) query.entity = entity;
    if (recordId) query.recordId = recordId;

    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }

    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);
  },

  async getUserActivity(userId, limit = 50) {
    return AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);
  },
};

module.exports = AuditService;
