const { Notification } = require('../models/notification.model');

const NotificationsService = {
  async create(data) {
    return Notification.create(data);
  },

  async list(userId, limit, offset, unreadOnly) {
    const filter = { user_id: userId };
    if (unreadOnly) filter.read = false;
    return Notification.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit);
  },

  async markRead(id) {
    return Notification.findByIdAndUpdate(id, { read: true, read_at: new Date() }, { new: true });
  },

  async markAllRead(userId) {
    await Notification.updateMany({ user_id: userId, read: false }, { read: true, read_at: new Date() });
  },

  async deleteNotification(id) {
    await Notification.findByIdAndDelete(id);
  },

  async unreadCount(userId) {
    return Notification.countDocuments({ user_id: userId, read: false });
  },
};

module.exports = NotificationsService;
