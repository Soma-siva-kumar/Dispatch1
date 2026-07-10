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
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dispatchiq');
  console.log('✅ Connected to MongoDB');

  const enableSeed = process.env.SEED_MODE === 'true';
  if (!enableSeed) {
    console.log('⚠️  Seed script is disabled by default to avoid demo data.');
    console.log('Set SEED_MODE=true and configure seed variables to create initial data.');
    process.exit(0);
  }

  // Clear existing data only when seeding intentionally
  await Promise.all([User.deleteMany(), PatrolUnit.deleteMany(), Incident.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('❌ SEED_MODE is enabled, but SEED_ADMIN_EMAIL and/or SEED_ADMIN_PASSWORD are missing.');
    console.log('Please set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.');
    process.exit(1);
  }

  await Promise.all([User.deleteMany(), PatrolUnit.deleteMany(), Incident.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  await User.create({
    name: 'Admin User',
    email: adminEmail,
    password: adminPassword,
    role: 'admin'
  });
  console.log(`👤 Created admin user: ${adminEmail}`);

  console.log('\n✅ Seed complete. The database now contains only the configured admin account.');
  process.exit(0);
