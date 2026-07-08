const mongoose = require('mongoose');

const PatrolUnitSchema = new mongoose.Schema({
  unitId: { type: String, required: true, unique: true }, // e.g. "PCR-001"
  officerName: { type: String, required: true },
  officerBadge: { type: String },
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  status: {
    type: String,
    enum: ['available', 'dispatched', 'en_route', 'on_scene', 'off_duty', 'break'],
    default: 'available'
  },
  currentIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', default: null },
  vehicleType: {
    type: String,
    enum: ['patrol_car', 'motorcycle', 'van', 'ambulance'],
    default: 'patrol_car'
  },
  zone: { type: String }, // e.g. "Zone-A", "Zone-B"
  lastSeen: { type: Date, default: Date.now },
  totalDispatches: { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 }, // minutes
}, { timestamps: true });

PatrolUnitSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PatrolUnit', PatrolUnitSchema);
