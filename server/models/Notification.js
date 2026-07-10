const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['dispatcher', 'officer'], required: true, index: true },
  type: {
    type: String,
    enum: ['new_incident', 'dispatch_assignment'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: 'bell' },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date },
  metadata: {
    incidentId: String,
    incidentType: String,
    priority: String,
    location: String,
    reportTime: Date,
    assignedTime: Date,
    dispatcherName: String,
  },
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
