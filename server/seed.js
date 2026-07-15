/**
 * Seed script — populates MongoDB with demo users, patrol units, and incidents
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const PatrolUnit = require('./models/PatrolUnit');
const Incident = require('./models/Incident');

// Hyderabad city center coordinates as base [lng, lat]
const BASE = [78.4867, 17.3850];

function randomOffset(range = 0.05) {
  return (Math.random() - 0.5) * range * 2;
}

function randomCoord() {
  return [BASE[0] + randomOffset(0.08), BASE[1] + randomOffset(0.06)];
}

const INCIDENT_TYPES = ['assault', 'robbery', 'shooting', 'accident', 'fire', 'medical', 'domestic_violence', 'theft', 'vandalism', 'suspicious', 'noise'];
const STATUSES = ['pending', 'dispatched', 'en_route', 'arrived', 'resolved'];

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dispatchiq';
  console.log(`📡 Connecting to MongoDB at ${MONGO_URI.split('@').pop()}...`);
  
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), PatrolUnit.deleteMany(), Incident.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // Admin credentials (from environment or defaults)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@dispatch.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';

  // Create users
  const users = await User.create([
    { name: 'Admin User', email: adminEmail, password: adminPassword, role: 'admin' },
    { name: 'Dispatcher Ravi', email: 'dispatcher@dispatch.com', password: 'password123', role: 'dispatcher' },
    { name: 'Officer Suresh', email: 'officer1@dispatch.com', password: 'password123', role: 'officer', badgeNumber: 'HYD-001' },
    { name: 'Officer Priya', email: 'officer2@dispatch.com', password: 'password123', role: 'officer', badgeNumber: 'HYD-002' },
    { name: 'Officer Kiran', email: 'officer3@dispatch.com', password: 'password123', role: 'officer', badgeNumber: 'HYD-003' },
    { name: 'Citizen Arjun', email: 'citizen@dispatch.com', password: 'password123', role: 'citizen' },
    { name: 'Citizen Meena', email: 'citizen2@dispatch.com', password: 'password123', role: 'citizen' },
  ]);
  console.log(`👤 Created ${users.length} users`);

  // Create patrol units
  const unitData = [
    { unitId: 'PCR-001', officerName: 'Officer Suresh', zone: 'Zone-A', status: 'available', vehicleType: 'patrol_car', assignedOfficer: users[2]._id },
    { unitId: 'PCR-002', officerName: 'Officer Priya', zone: 'Zone-B', status: 'available', vehicleType: 'patrol_car', assignedOfficer: users[3]._id },
    { unitId: 'PCR-003', officerName: 'Officer Kiran', zone: 'Zone-C', status: 'dispatched', vehicleType: 'patrol_car', assignedOfficer: users[4]._id },
    { unitId: 'MBK-001', officerName: 'Officer Raju', zone: 'Zone-A', status: 'available', vehicleType: 'motorcycle' },
    { unitId: 'MBK-002', officerName: 'Officer Deepa', zone: 'Zone-D', status: 'off_duty', vehicleType: 'motorcycle' },
    { unitId: 'AMB-001', officerName: 'Officer Kumar', zone: 'Zone-B', status: 'available', vehicleType: 'ambulance' },
    { unitId: 'PCR-004', officerName: 'Officer Anjali', zone: 'Zone-C', status: 'available', vehicleType: 'patrol_car' },
    { unitId: 'PCR-005', officerName: 'Officer Venkat', zone: 'Zone-D', status: 'on_scene', vehicleType: 'patrol_car' },
  ];

  const units = await PatrolUnit.insertMany(
    unitData.map(u => ({
      ...u,
      location: { type: 'Point', coordinates: randomCoord() },
      totalDispatches: Math.floor(Math.random() * 50),
      avgResponseTime: (4 + Math.random() * 8).toFixed(1),
    }))
  );
  console.log(`🚔 Created ${units.length} patrol units`);

  // Create incidents (mix of statuses, priorities, types)
  const incidentTemplates = [
    { title: 'Armed Robbery at ATM', type: 'robbery', weaponInvolved: true, peopleAffected: 3 },
    { title: 'Road Accident on NH-44', type: 'accident', weaponInvolved: false, peopleAffected: 5 },
    { title: 'Domestic Violence Reported', type: 'domestic_violence', weaponInvolved: true, peopleAffected: 2 },
    { title: 'Building Fire in Begumpet', type: 'fire', weaponInvolved: false, peopleAffected: 12 },
    { title: 'Medical Emergency: Cardiac Arrest', type: 'medical', weaponInvolved: false, peopleAffected: 1 },
    { title: 'Theft at Jewelry Shop', type: 'theft', weaponInvolved: false, peopleAffected: 1 },
    { title: 'Assault Outside Bar', type: 'assault', weaponInvolved: false, peopleAffected: 2 },
    { title: 'Suspicious Vehicle Parked', type: 'suspicious', weaponInvolved: false, peopleAffected: 0 },
    { title: 'Gunshots Heard - Malakpet', type: 'shooting', weaponInvolved: true, peopleAffected: 1 },
    { title: 'Noise Complaint - Late Night Party', type: 'noise', weaponInvolved: false, peopleAffected: 0 },
    { title: 'Chain Snatching on MG Road', type: 'robbery', weaponInvolved: false, peopleAffected: 1 },
    { title: 'Vehicle Vandalism Near Stadium', type: 'vandalism', weaponInvolved: false, peopleAffected: 0 },
    { title: 'Missing Person Report', type: 'other', weaponInvolved: false, peopleAffected: 1 },
    { title: 'Mass Brawl at Charminar', type: 'assault', weaponInvolved: true, peopleAffected: 8 },
    { title: 'Chemical Smell - Industrial Area', type: 'fire', weaponInvolved: false, peopleAffected: 20 },
  ];

  const { scoreIncident } = require('./services/priorityEngine');

  const incidents = [];
  for (let i = 0; i < incidentTemplates.length; i++) {
    const tmpl = incidentTemplates[i];
    const desc = `Emergency reported: ${tmpl.title}. Immediate response required.`;
    const { priority, score } = scoreIncident({ ...tmpl, description: desc });
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const dispatchedAt = status !== 'pending' ? new Date(Date.now() - Math.random() * 3600000) : undefined;
    const arrivedAt = ['arrived', 'resolved'].includes(status) ? new Date(dispatchedAt.getTime() + Math.random() * 600000) : undefined;
    const resolvedAt = status === 'resolved' ? new Date(arrivedAt.getTime() + Math.random() * 1800000) : undefined;

    incidents.push({
      ...tmpl,
      description: desc,
      location: { type: 'Point', coordinates: randomCoord(), address: `Hyderabad, Zone-${String.fromCharCode(65 + (i % 4))}` },
      priority,
      priorityScore: score,
      status,
      reportedBy: users[5 + (i % 2)]._id,
      assignedUnit: status !== 'pending' ? units[i % units.length]._id : undefined,
      dispatchedAt,
      arrivedAt,
      resolvedAt,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600000),
      timeline: [{ status: 'pending', note: 'Incident reported' }],
    });
  }

  // Add more historical incidents for charts
  for (let d = 1; d <= 25; d++) {
    for (let j = 0; j < 3; j++) {
      const tmpl = incidentTemplates[Math.floor(Math.random() * incidentTemplates.length)];
      const desc = `Historical incident: ${tmpl.title}`;
      const { priority, score } = scoreIncident({ ...tmpl, description: desc });
      const ts = new Date(Date.now() - d * 24 * 3600000);
      incidents.push({
        ...tmpl,
        description: desc,
        location: { type: 'Point', coordinates: randomCoord(), address: 'Hyderabad' },
        priority,
        priorityScore: score,
        status: 'resolved',
        reportedBy: users[5]._id,
        dispatchedAt: new Date(ts.getTime() + 120000),
        arrivedAt: new Date(ts.getTime() + 480000),
        resolvedAt: new Date(ts.getTime() + 1800000),
        createdAt: ts,
        timeline: [{ status: 'resolved', note: 'Resolved' }],
      });
    }
  }

  await Incident.insertMany(incidents);
  console.log(`🚨 Created ${incidents.length} incidents`);

  console.log('\n✅ Seed complete! Login credentials:');
  console.log(`  Admin:      ${adminEmail} / ${adminPassword === 'password123' ? 'password123' : '(configured password)'}`);
  console.log('  Dispatcher: dispatcher@dispatch.com / password123');
  console.log('  Officer:    officer1@dispatch.com / password123');
  console.log('  Citizen:    citizen@dispatch.com / password123');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
