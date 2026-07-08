const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const { scoreIncident } = require('../services/priorityEngine');
const { findNearestUnits, autoDispatch } = require('../services/dispatchEngine');
const auth = require('../middleware/auth');

// POST /api/incidents — Create new incident (citizen)
router.post('/', auth(['citizen', 'dispatcher', 'admin']), async (req, res) => {
  try {
    const { title, description, type, coordinates, address, weaponInvolved, peopleAffected } = req.body;

    // Run AI priority scoring
    const { priority, score } = scoreIncident({ type, description, weaponInvolved, peopleAffected });

    const incident = await Incident.create({
      title,
      description,
      type,
      location: { type: 'Point', coordinates, address },
      weaponInvolved: weaponInvolved || false,
      peopleAffected: peopleAffected || 1,
      priority,
      priorityScore: score,
      reportedBy: req.user.id,
      timeline: [{ status: 'pending', note: 'Incident reported' }],
    });

    await incident.populate('reportedBy', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('incident:new', { incident });

    // Auto-dispatch P1 incidents immediately
    if (priority === 'P1') {
      try {
        await autoDispatch(incident._id, null, io);
      } catch (e) {
        console.warn('[AutoDispatch P1]', e.message);
      }
    }

    res.status(201).json({ incident, priority, score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/incidents — All incidents (dispatcher/admin)
router.get('/', auth(['dispatcher', 'admin', 'officer']), async (req, res) => {
  try {
    const { status, priority, limit = 100 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedUnit')
      .sort({ priorityScore: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/incidents/mine — Citizen's own incidents
router.get('/mine', auth(), async (req, res) => {
  try {
    const incidents = await Incident.find({ reportedBy: req.user.id })
      .populate('assignedUnit')
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/incidents/:id — Single incident
router.get('/:id', auth(), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedUnit');
    if (!incident) return res.status(404).json({ message: 'Not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/incidents/:id/status — Update status
router.patch('/:id/status', auth(['dispatcher', 'officer', 'admin']), async (req, res) => {
  try {
    const { status, note } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Not found' });

    incident.status = status;
    incident.timeline.push({ status, note: note || `Status updated to ${status}` });

    if (status === 'arrived') incident.arrivedAt = new Date();
    if (status === 'resolved') incident.resolvedAt = new Date();

    await incident.save();
    await incident.populate('assignedUnit reportedBy');

    const io = req.app.get('io');
    if (io) io.emit('incident:update', { incident });

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/incidents/:id/dispatch — Dispatch unit
router.post('/:id/dispatch', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const { unitId } = req.body;
    const io = req.app.get('io');
    const { unit, incident } = await autoDispatch(req.params.id, unitId || null, io);
    res.json({ unit, incident });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/incidents/:id/nearest-units — Find nearest available units
router.get('/:id/nearest-units', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Not found' });
    const units = await findNearestUnits(incident.location.coordinates, 5);
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/incidents/:id/notes — Add note
router.post('/:id/notes', auth(), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Not found' });
    incident.notes.push({ text: req.body.text, addedBy: req.user.id });
    await incident.save();
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
