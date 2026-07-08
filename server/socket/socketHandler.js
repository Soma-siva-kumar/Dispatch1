/**
 * Socket.IO Event Handler
 * Manages real-time bi-directional communication
 */

const jwt = require('jsonwebtoken');
const PatrolUnit = require('../models/PatrolUnit');
const Incident = require('../models/Incident');

function initSocket(io) {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
      } catch {
        // Allow anonymous (citizen) connections with limited events
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id} | Role: ${socket.user?.role || 'anonymous'}`);

    // Join role-specific rooms
    if (socket.user) {
      socket.join(`role:${socket.user.role}`);
      socket.join(`user:${socket.user.id}`);
    }

    // Officer joins their unit room
    socket.on('unit:join', ({ unitId }) => {
      socket.join(`unit:${unitId}`);
      console.log(`[Socket] Officer joined unit room: unit:${unitId}`);
    });

    // Officer updates GPS position
    socket.on('unit:position', async ({ unitId, coordinates }) => {
      try {
        await PatrolUnit.findByIdAndUpdate(unitId, {
          'location.coordinates': coordinates,
          lastSeen: new Date(),
        });
        // Broadcast to all control room dashboards
        io.emit('unit:position', { unitId, coordinates, timestamp: new Date() });
      } catch (err) {
        console.error('[Socket] unit:position error:', err.message);
      }
    });

    // Officer acknowledges dispatch
    socket.on('unit:ack', async ({ incidentId, unitId }) => {
      try {
        const incident = await Incident.findById(incidentId);
        if (incident && incident.status === 'dispatched') {
          incident.status = 'en_route';
          incident.timeline.push({ status: 'en_route', note: 'Officer en route to incident' });
          await incident.save();
          io.emit('incident:update', { incident });
          console.log(`[Socket] Unit ${unitId} acknowledged dispatch for ${incidentId}`);
        }
      } catch (err) {
        console.error('[Socket] unit:ack error:', err.message);
      }
    });

    // Citizen tracks their incident
    socket.on('incident:track', ({ incidentId }) => {
      socket.join(`incident:${incidentId}`);
    });

    // Chat / notes in control room
    socket.on('control:message', (data) => {
      io.to('role:dispatcher').to('role:admin').emit('control:message', {
        ...data,
        from: socket.user?.id,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initSocket };
