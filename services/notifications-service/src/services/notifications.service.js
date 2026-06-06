const { Notification, NotificationSettings } = require('../models/notification.model');
const { messageQueue } = require('../services/redis.service');
const PushService = require('./push.service');
const config = require('../config');

const NotificationsService = {
  async createNotification(notificationData) {
    const notification = await Notification.create(notificationData);
    
    // Enviar notificación Push en segundo plano
    PushService.sendPushNotification(
      notificationData.user_id,
      notificationData.title,
      notificationData.message,
      { notification_id: notification.id, type: notificationData.type }
    ).catch(err => console.error('[NOTIFICATIONS] Push error:', err.message));

    await messageQueue.publish('notifications:new', {
      user_id: notificationData.user_id,
      notification_id: notification.id,
      type: notificationData.type,
    });
    
    return notification;
  },

  async createStockLowNotification(userId, productData) {
    return await this.createNotification({
      type: 'stock_low',
      title: 'Stock Bajo',
      message: `El producto "${productData.name}" tiene stock bajo (${productData.stock_quantity} unidades)`,
      priority: 'high',
      data: {
        product_id: productData.id,
        product_name: productData.name,
        current_stock: productData.stock_quantity,
        min_stock: productData.min_stock_level,
      },
      user_id: userId,
    });
  },

  async createStockExpiringNotification(userId, productData) {
    return await this.createNotification({
      type: 'stock_expiring',
      title: 'Producto Por Vencer',
      message: `El producto "${productData.name}" vence el ${productData.expiration_date}`,
      priority: 'medium',
      data: {
        product_id: productData.id,
        product_name: productData.name,
        expiration_date: productData.expiration_date,
      },
      user_id: userId,
    });
  },

  async createCreditExpiringNotification(userId, creditData) {
    return await this.createNotification({
      type: 'credit_expiring',
      title: 'Crédito Por Vencer',
      message: `El crédito del cliente "${creditData.customer_name}" vence el ${creditData.payment_due_date}`,
      priority: 'high',
      data: {
        credit_id: creditData.id,
        customer_name: creditData.customer_name,
        balance: creditData.balance,
        due_date: creditData.payment_due_date,
      },
      user_id: userId,
    });
  },

  async createCreditOverdueNotification(userId, creditData) {
    return await this.createNotification({
      type: 'credit_overdue',
      title: 'Crédito Vencido',
      message: `El crédito del cliente "${creditData.customer_name}" está vencido`,
      priority: 'critical',
      data: {
        credit_id: creditData.id,
        customer_name: creditData.customer_name,
        balance: creditData.balance,
        due_date: creditData.payment_due_date,
      },
      user_id: userId,
    });
  },

  async getNotifications(userId, options = {}) {
    const { limit = 50, offset = 0, unread_only = false } = options;
    
    const query = { user_id: userId };
    if (unread_only) {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    
    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ user_id: userId, read: false });
    
    return {
      notifications,
      total,
      unread,
    };
  },

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user_id: userId },
      { read: true, read_at: new Date() },
      { new: true }
    );
    return notification;
  },

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user_id: userId, read: false },
      { read: true, read_at: new Date() }
    );
  },

  async deleteNotification(notificationId, userId) {
    await Notification.findOneAndDelete({ _id: notificationId, user_id: userId });
  },

  async getNotificationSettings(userId) {
    let settings = await NotificationSettings.findOne({ user_id: userId });
    
    if (!settings) {
      settings = await NotificationSettings.create({ user_id: userId });
    }
    
    return settings;
  },

  async updateNotificationSettings(userId, settings) {
    const { push_token, ...otherSettings } = settings;
    
    let updateQuery = { ...otherSettings, updated_at: new Date() };
    
    // Si viene un push_token, lo agregamos al array sin duplicados
    let updateOperation = { $set: updateQuery };
    if (push_token) {
      updateOperation.$addToSet = { push_tokens: push_token };
    }

    const updated = await NotificationSettings.findOneAndUpdate(
      { user_id: userId },
      updateOperation,
      { new: true, upsert: true }
    );
    return updated;
  },

  async getUnreadCount(userId) {
    return await Notification.countDocuments({ user_id: userId, read: false });
  },
};

module.exports = NotificationsService;
