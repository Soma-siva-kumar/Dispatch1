const Notification = require('../models/Notification');
const User = require('../models/User');

function serializeNotification(notification) {
  const obj = typeof notification.toObject === 'function' ? notification.toObject() : notification;
  return {
    ...obj,
    _id: String(obj._id),
    recipient: String(obj.recipient),
  };
}

function incidentLocation(incident) {
  return incident.location?.address || incident.title || 'Location unavailable';
}

async function emitToRecipient(io, notification) {
  if (!io || !notification?.recipient) return;
  io.to(`user:${notification.recipient}`).emit('notification:new', {
    notification: serializeNotification(notification),
  });
}

async function notifyDispatchersOfNewIncident(incident, io) {
  const dispatchers = await User.find({ role: 'dispatcher', isActive: { $ne: false } }).select('_id role');
  if (!dispatchers.length) return [];

  const docs = await Notification.insertMany(dispatchers.map(user => ({
    recipient: user._id,
    role: 'dispatcher',
    type: 'new_incident',
    icon: 'siren',
    title: '\u{1F6A8} New Emergency Report',
    message: 'A new emergency incident has been reported by a citizen.',
    metadata: {
      incidentId: String(incident._id),
      incidentType: incident.type,
      priority: incident.priority,
      location: incidentLocation(incident),
      reportTime: incident.createdAt || new Date(),
    },
  })));

  await Promise.all(docs.map(notification => emitToRecipient(io, notification)));
  return docs;
}

async function notifyOfficerOfDispatch({ incident, unit, dispatcherName, io }) {
  if (!unit?.assignedOfficer) return null;

  const notification = await Notification.create({
    recipient: unit.assignedOfficer,
    role: 'officer',
    type: 'dispatch_assignment',
    icon: 'car',
    title: '\u{1F694} New Dispatch Assignment',
    message: 'You have been assigned a new emergency incident.',
    metadata: {
      incidentId: String(incident._id),
      incidentType: incident.type,
      priority: incident.priority,
      location: incidentLocation(incident),
      assignedTime: incident.dispatchedAt || new Date(),
      dispatcherName: dispatcherName || 'DispatchIQ Auto Dispatch',
    },
  });

  await emitToRecipient(io, notification);
  return notification;
}

module.exports = {
  notifyDispatchersOfNewIncident,
  notifyOfficerOfDispatch,
  serializeNotification,
};
