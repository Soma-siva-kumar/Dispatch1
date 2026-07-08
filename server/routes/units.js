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
    res.status(201).json(unit);
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
