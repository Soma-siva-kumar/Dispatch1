/**
 * Geospatial Dispatch Engine
 * Finds the nearest available patrol unit to an incident using MongoDB $geoNear
 */

const PatrolUnit = require('../models/PatrolUnit');
const Incident = require('../models/Incident');
const { notifyOfficerOfDispatch } = require('./notificationService');

/**
 * Haversine distance formula (km)
 */
function haversineDistance([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Find nearest available patrol units to an incident location
 * @param {Array} coordinates - [lng, lat] of incident
 * @param {number} limit - max units to return (default 5)
 * @returns {Array} ranked available units with distance
 */
async function findNearestUnits(coordinates, limit = 5) {
  const units = await PatrolUnit.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distanceMeters',
        maxDistance: 50000, // 50km radius
        query: { status: 'available' },
        spherical: true,
      },
    },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedOfficer',
        foreignField: '_id',
        as: 'officerInfo',
      },
    },
    {
      $addFields: {
        distanceKm: { $divide: ['$distanceMeters', 1000] },
        officerInfo: { $arrayElemAt: ['$officerInfo', 0] },
      },
    },
  ]);
  return units;
}

/**
 * Auto-dispatch nearest unit to an incident
 * @param {string} incidentId
 * @param {string|null} overrideUnitId - manual override
 * @returns {{ unit, incident }}
 */
async function autoDispatch(incidentId, overrideUnitId = null, io = null, dispatcherName = null) {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw new Error('Incident not found');

  let unit;
  if (overrideUnitId) {
    unit = await PatrolUnit.findById(overrideUnitId);
  } else {
    const nearestUnits = await findNearestUnits(incident.location.coordinates, 1);
    if (!nearestUnits.length) throw new Error('No available units in range');
    unit = await PatrolUnit.findById(nearestUnits[0]._id);
  }

  if (!unit) throw new Error('Unit not found');

  // Update unit status
  unit.status = 'dispatched';
  unit.currentIncident = incident._id;
  unit.totalDispatches += 1;
  await unit.save();

  // Update incident
  incident.status = 'dispatched';
  incident.assignedUnit = unit._id;
  incident.dispatchedAt = new Date();
  incident.timeline.push({ status: 'dispatched', note: `Dispatched unit ${unit.unitId}` });
  await incident.save();

  await incident.populate([
    { path: 'assignedUnit' },
    { path: 'reportedBy', select: 'name email phone' }
  ]);

  // Emit socket event if io provided
  if (io) {
    io.emit('incident:update', { incident });
    // Notify the specific officer
    io.to(`unit:${unit._id}`).emit('unit:dispatch', {
      incident: incident.toObject(),
      unit: unit.toObject(),
      message: `🚨 You have been dispatched to: ${incident.title}`,
    });
  }

  try {
    await notifyOfficerOfDispatch({ incident, unit, dispatcherName, io });
  } catch (e) {
    console.warn('[Notifications] officer dispatch alert failed:', e.message);
  }

  return { unit, incident };
}

module.exports = { findNearestUnits, autoDispatch, haversineDistance };
