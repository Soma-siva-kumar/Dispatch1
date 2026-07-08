const express = require('express');
const router = express.Router();
const PatrolUnit = require('../models/PatrolUnit');
const auth = require('../middleware/auth');

// GET /api/units — All patrol units
router.get('/', auth(['dispatcher', 'admin', 'officer']), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const units = await PatrolUnit.find(filter).populate('assignedOfficer', 'name email').populate('currentIncident', 'title status priority');
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/units — Create patrol unit (admin)
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const unit = await PatrolUnit.create(req.body);
    // Link to officer if assigned
    if (unit.assignedOfficer) {
      await require('../models/User').findByIdAndUpdate(unit.assignedOfficer, { assignedUnit: unit._id });
    }
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/units/:id — Update general patrol unit details (admin only)
router.patch('/:id', auth(['admin']), async (req, res) => {
  try {
    const { unitId, officerName, officerBadge, assignedOfficer, vehicleType, zone, status } = req.body;
    const unit = await PatrolUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Patrol unit not found' });

    const oldOfficerId = unit.assignedOfficer;

    if (unitId) unit.unitId = unitId;
    if (officerName) unit.officerName = officerName;
    if (officerBadge) unit.officerBadge = officerBadge;
    if (vehicleType) unit.vehicleType = vehicleType;
    if (zone) unit.zone = zone;
    if (status) unit.status = status;
    
    if (assignedOfficer !== undefined) {
      unit.assignedOfficer = assignedOfficer || null;
    }

    await unit.save();

    // Handle updating officer documents
    const User = require('../models/User');
    if (assignedOfficer !== undefined) {
      // Clear old officer's assignment
      if (oldOfficerId && oldOfficerId.toString() !== assignedOfficer) {
        await User.findByIdAndUpdate(oldOfficerId, { assignedUnit: null });
      }
      // Set new officer's assignment
      if (assignedOfficer) {
        await User.findByIdAndUpdate(assignedOfficer, { assignedUnit: unit._id });
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('unit:statusUpdate', { unit });

    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/units/:id — Delete patrol unit (admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const unit = await PatrolUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Patrol unit not found' });

    // Clear officer link
    if (unit.assignedOfficer) {
      await require('../models/User').findByIdAndUpdate(unit.assignedOfficer, { assignedUnit: null });
    }

    await PatrolUnit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patrol unit deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/units/:id/status — Update unit status
router.patch('/:id/status', auth(['officer', 'dispatcher', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const unit = await PatrolUnit.findByIdAndUpdate(req.params.id, { status }, { new: true });
    const io = req.app.get('io');
    if (io) io.emit('unit:statusUpdate', { unit });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/units/:id/location — Update unit GPS position
router.patch('/:id/location', auth(['officer', 'admin']), async (req, res) => {
  try {
    const { coordinates } = req.body; // [lng, lat]
    const unit = await PatrolUnit.findByIdAndUpdate(
      req.params.id,
      { 'location.coordinates': coordinates, lastSeen: new Date() },
      { new: true }
    );
    const io = req.app.get('io');
    if (io) io.emit('unit:position', { unitId: unit._id, unitCode: unit.unitId, coordinates, status: unit.status });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/units/:id — Single unit
router.get('/:id', auth(), async (req, res) => {
  try {
    const unit = await PatrolUnit.findById(req.params.id).populate('assignedOfficer currentIncident');
    if (!unit) return res.status(404).json({ message: 'Not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
