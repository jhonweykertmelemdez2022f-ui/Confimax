const NotificationsService = require('../services/notifications.service');

const notificationController = {
  async createNotification(req, res, next) {
    try { res.status(201).json(await NotificationsService.createNotification(req.body)); }
    catch (e) { next(e); }
  },
  async getNotifications(req, res, next) {
    try {
      const { limit = 50, offset = 0, unread_only } = req.query;
      res.json(await NotificationsService.getNotifications(req.params.user_id, {
        limit: parseInt(limit), offset: parseInt(offset), unread_only: unread_only === 'true',
      }));
    } catch (e) { next(e); }
  },
  async markAsRead(req, res, next) {
    try {
      const notification = await NotificationsService.markAsRead(req.params.id, req.query.user_id);
      if (!notification) return res.status(404).json({ message: 'Notification not found' });
      res.json(notification);
    } catch (e) { next(e); }
  },
  async markAllAsRead(req, res, next) {
    try { await NotificationsService.markAllAsRead(req.body.user_id); res.json({ message: 'All notifications marked as read' }); }
    catch (e) { next(e); }
  },
  async deleteNotification(req, res, next) {
    try { await NotificationsService.deleteNotification(req.params.id, req.query.user_id); res.status(204).send(); }
    catch (e) { next(e); }
  },
  async getSettings(req, res, next) {
    try { res.json(await NotificationsService.getNotificationSettings(req.params.user_id)); }
    catch (e) { next(e); }
  },
  async updateSettings(req, res, next) {
    try { res.json(await NotificationsService.updateNotificationSettings(req.params.user_id, req.body)); }
    catch (e) { next(e); }
  },
  async getUnreadCount(req, res, next) {
    try { res.json({ user_id: req.params.user_id, unread_count: await NotificationsService.getUnreadCount(req.params.user_id) }); }
    catch (e) { next(e); }
  },
};

module.exports = notificationController;
