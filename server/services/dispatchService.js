const Incident = require('../models/Incident');
const PatrolUnit = require('../models/PatrolUnit');
const { autoDispatch } = require('./dispatchEngine');

class DispatchService {
  /**
   * Dispatches Police Patrol Unit
   */
  async dispatchPolice(incidentId, unitId, io, dispatcherName) {
    const { unit, incident } = await autoDispatch(incidentId, unitId, io, dispatcherName);
    
    // Add record to dispatch history
    incident.dispatchHistory.push({
      agencyType: 'police',
      resourceName: unit.unitId,
      status: 'dispatched',
      notes: `Officer ${unit.officerName} dispatched.`
    });
    
    await incident.save();
    return { unit, incident };
  }

  /**
   * Dispatches Fire Station / Engines
   */
  async dispatchFireStation(incidentId, fireStation, io) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.assignedFireStation = {
      name: fireStation.name,
      address: fireStation.address,
      contact: fireStation.contact,
      distance: fireStation.distanceKm,
      eta: fireStation.etaMins,
      lat: fireStation.lat,
      lng: fireStation.lng,
      dispatchedAt: new Date()
    };

    if (incident.status === 'pending') {
      incident.status = 'dispatched';
      incident.dispatchedAt = new Date();
    }

    incident.timeline.push({
      status: 'dispatched_fire',
      timestamp: new Date(),
      note: `Dispatched Fire Station: ${fireStation.name} (ETA: ${fireStation.etaMins} mins)`
    });

    incident.dispatchHistory.push({
      agencyType: 'fire',
      resourceName: fireStation.name,
      status: 'dispatched',
      timestamp: new Date(),
      notes: `Dispatched fire tender from ${fireStation.name}. Contact: ${fireStation.contact}`
    });

    await incident.save();
    await incident.populate(['reportedBy', 'assignedUnit']);

    if (io) {
      io.emit('incident:update', { incident });
      // Notify dispatchers/admins about the multi-agency dispatch
      io.emit('agency:dispatch', { incidentId, agencyType: 'fire', resource: fireStation });
    }

    return incident;
  }

  /**
   * Dispatches Hospital / Trauma Center
   */
  async dispatchHospital(incidentId, hospital, io) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.assignedHospital = {
      name: hospital.name,
      address: hospital.address,
      contact: hospital.contact,
      distance: hospital.distanceKm,
      eta: hospital.etaMins,
      lat: hospital.lat,
      lng: hospital.lng,
      dispatchedAt: new Date()
    };

    if (incident.status === 'pending') {
      incident.status = 'dispatched';
      incident.dispatchedAt = new Date();
    }

    incident.timeline.push({
      status: 'dispatched_hospital',
      timestamp: new Date(),
      note: `Notified Hospital: ${hospital.name} (ETA: ${hospital.etaMins} mins)`
    });

    incident.dispatchHistory.push({
      agencyType: 'hospital',
      resourceName: hospital.name,
      status: 'dispatched',
      timestamp: new Date(),
      notes: `Alerted Emergency ER at ${hospital.name}. Contact: ${hospital.contact}`
    });

    await incident.save();
    await incident.populate(['reportedBy', 'assignedUnit']);

    if (io) {
      io.emit('incident:update', { incident });
      io.emit('agency:dispatch', { incidentId, agencyType: 'hospital', resource: hospital });
    }

    return incident;
  }

  /**
   * Dispatches Ambulance Service
   */
  async dispatchAmbulance(incidentId, ambulance, io) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.assignedAmbulance = {
      name: ambulance.name,
      address: ambulance.address,
      contact: ambulance.contact,
      distance: ambulance.distanceKm,
      eta: ambulance.etaMins,
      lat: ambulance.lat,
      lng: ambulance.lng,
      dispatchedAt: new Date()
    };

    if (incident.status === 'pending') {
      incident.status = 'dispatched';
      incident.dispatchedAt = new Date();
    }

    incident.timeline.push({
      status: 'dispatched_ambulance',
      timestamp: new Date(),
      note: `Dispatched Ambulance: ${ambulance.name} (ETA: ${ambulance.etaMins} mins)`
    });

    incident.dispatchHistory.push({
      agencyType: 'ambulance',
      resourceName: ambulance.name,
      status: 'dispatched',
      timestamp: new Date(),
      notes: `Ambulance dispatched. Contact: ${ambulance.contact}`
    });

    await incident.save();
    await incident.populate(['reportedBy', 'assignedUnit']);

    if (io) {
      io.emit('incident:update', { incident });
      io.emit('agency:dispatch', { incidentId, agencyType: 'ambulance', resource: ambulance });
    }

    return incident;
  }
}

module.exports = new DispatchService();
