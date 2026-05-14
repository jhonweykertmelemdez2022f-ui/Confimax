const { getMongoose } = require('./index');
const mongoose = getMongoose();

const auditSchema = new mongoose.Schema({
  entity: { type: String, required: true },
  operation: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER'],
  },
  recordId: { type: String, required: false },
  oldData: { type: mongoose.Schema.Types.Mixed },
  newData: { type: mongoose.Schema.Types.Mixed },
  userId: { type: String, required: false },
  username: { type: String, required: false },
  ipAddress: { type: String },
  endpoint: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  errorMessage: { type: String },
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false },
  collection: 'audit_logs',
});

auditSchema.index({ entity: 1, timestamp: -1 });
auditSchema.index({ operation: 1, timestamp: -1 });
auditSchema.index({ userId: 1, timestamp: -1 });
auditSchema.index({ entity: 1, recordId: 1 });
auditSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditSchema);

module.exports = { AuditLog };
