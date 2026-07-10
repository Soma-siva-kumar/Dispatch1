const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['assault', 'robbery', 'shooting', 'accident', 'fire', 'medical', 'domestic_violence', 'theft', 'vandalism', 'suspicious', 'noise', 'other'],
    required: true
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: { type: String }
  },
  priority: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4'],
    default: 'P3'
  },
  priorityScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'en_route', 'arrived', 'resolved', 'cancelled'],
    default: 'pending'
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'PatrolUnit' },
  weaponInvolved: { type: Boolean, default: false },
  peopleAffected: { type: Number, default: 1 },
  severityKeywords: [String],
  escalated: { type: Boolean, default: false },
  escalationReason: { type: String },
  dispatchedAt: { type: Date },
  arrivedAt: { type: Date },
  resolvedAt: { type: Date },
  notes: [{
    text: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  assignedPolice: { type: mongoose.Schema.Types.ObjectId, ref: 'PatrolUnit' },
  assignedFireStation: {
    name: String,
    address: String,
    contact: String,
    distance: Number,
    eta: Number,
    lat: Number,
    lng: Number,
    dispatchedAt: Date
  },
  assignedHospital: {
    name: String,
    address: String,
    contact: String,
    distance: Number,
    eta: Number,
    lat: Number,
    lng: Number,
    dispatchedAt: Date
  },
  assignedAmbulance: {
    name: String,
    address: String,
    contact: String,
    distance: Number,
    eta: Number,
    lat: Number,
    lng: Number,
    dispatchedAt: Date
  },
  dispatchHistory: [{
    agencyType: { type: String, enum: ['police', 'fire', 'hospital', 'ambulance'] },
    resourceName: String,
    status: { type: String, default: 'dispatched' },
    timestamp: { type: Date, default: Date.now },
    notes: String
  }],
  isVoiceReport: { type: Boolean, default: false },
  voiceTranscript: { type: String },
  voiceQATranscript: [{
    question: { type: String },
    answer: { type: String }
  }],
  aiAnalysis: {
    incidentType: { type: String },
    priority: { type: String },
    keywords: { type: [String] },
    severity: { type: String },
    possibleEmergencyCategory: { type: String },
    suggestedResponse: { type: String },
    confidenceScore: { type: Number }
  }
}, { timestamps: true });

IncidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Incident', IncidentSchema);
