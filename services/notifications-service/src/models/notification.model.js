const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['stock_low', 'stock_expiring', 'credit_expiring', 'credit_overdue', 'system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  read: {
    type: Boolean,
    default: false,
  },
  user_id: {
    type: String,
    required: true,
  },
  read_at: Date,
}, {
  timestamps: true,
});

notificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

const NotificationSettingsSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  email_notifications: {
    type: Boolean,
    default: true,
  },
  push_notifications: {
    type: Boolean,
    default: true,
  },
  push_tokens: {
    type: [String],
    default: [],
  },
  notification_types: {
    stock_low: { type: Boolean, default: true },
    stock_expiring: { type: Boolean, default: true },
    credit_expiring: { type: Boolean, default: true },
    credit_overdue: { type: Boolean, default: true },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const NotificationSettings = mongoose.model('NotificationSettings', NotificationSettingsSchema);

module.exports = {
  Notification,
  NotificationSettings,
};
