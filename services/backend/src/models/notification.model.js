const { getMongoose } = require('./index');
const mongoose = getMongoose();

const notificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['stock_low','stock_expiring','credit_expiring','credit_overdue','system','info'], default: 'info' },
  priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  read_at: Date,
}, { timestamps: true });

notificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
