const NotificationsService = require('../services/notifications.service');

const notificationsController = {
  async create(req, res, next) {
    try { res.status(201).json(await NotificationsService.create(req.body)); }
    catch (e) { next(e); }
  },

  async list(req, res, next) {
    try {
      const { user_id, limit = 50, offset = 0, unread_only } = req.query;
      const docs = await NotificationsService.list(user_id, parseInt(limit), parseInt(offset), unread_only === 'true');
      res.json(docs);
    } catch (e) { next(e); }
  },

  async markRead(req, res, next) {
    try {
      const doc = await NotificationsService.markRead(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Notification not found' });
      res.json(doc);
    } catch (e) { next(e); }
  },

  async markAllRead(req, res, next) {
    try {
      await NotificationsService.markAllRead(req.body.user_id);
      res.json({ message: 'All notifications marked as read' });
    } catch (e) { next(e); }
  },

  async deleteNotification(req, res, next) {
    try { await NotificationsService.deleteNotification(req.params.id); res.status(204).send(); }
    catch (e) { next(e); }
  },

  async unreadCount(req, res, next) {
    try {
      const count = await NotificationsService.unreadCount(req.params.user_id);
      res.json({ user_id: req.params.user_id, unread_count: count });
    } catch (e) { next(e); }
  },
};

module.exports = notificationsController;
