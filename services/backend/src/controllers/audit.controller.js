const AuditService = require('../services/audit.service');

const auditController = {
  async getLogs(req, res, next) {
    try {
      const { limit = 100, offset = 0, operation, userId, entity, recordId, start_date, end_date } = req.query;
      const filters = {};
      if (operation) filters.operation = operation;
      if (userId) filters.userId = userId;
      if (entity) filters.entity = entity;
      if (recordId) filters.recordId = recordId;
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const logs = await AuditService.getLogs(filters, parseInt(limit), parseInt(offset));
      res.json(logs);
    } catch (e) { next(e); }
  },

  async getUserActivity(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;
      const logs = await AuditService.getUserActivity(userId, parseInt(limit));
      res.json(logs);
    } catch (e) { next(e); }
  },
};

module.exports = auditController;
