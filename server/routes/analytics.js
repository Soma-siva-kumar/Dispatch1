const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const PatrolUnit = require('../models/PatrolUnit');
const auth = require('../middleware/auth');

// GET /api/analytics/summary — Dashboard summary cards
router.get('/summary', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const [total, pending, dispatched, resolved, activeUnits, availableUnits] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'pending' }),
      Incident.countDocuments({ status: { $in: ['dispatched', 'en_route', 'arrived'] } }),
      Incident.countDocuments({ status: 'resolved' }),
      PatrolUnit.countDocuments({ status: { $ne: 'off_duty' } }),
      PatrolUnit.countDocuments({ status: 'available' }),
    ]);

    // Average response time (minutes) for resolved incidents
    const resolvedWithTimes = await Incident.find({
      status: 'resolved',
      dispatchedAt: { $exists: true },
      arrivedAt: { $exists: true },
    }).select('dispatchedAt arrivedAt');

    let avgResponseTime = 0;
    if (resolvedWithTimes.length) {
      const totalMinutes = resolvedWithTimes.reduce((sum, i) => {
        return sum + (new Date(i.arrivedAt) - new Date(i.dispatchedAt)) / 60000;
      }, 0);
      avgResponseTime = (totalMinutes / resolvedWithTimes.length).toFixed(1);
    }

    res.json({ total, pending, dispatched, resolved, activeUnits, availableUnits, avgResponseTime });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/incidents-by-type — Pie/bar chart data
router.get('/incidents-by-type', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const data = await Incident.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/incidents-by-priority — Priority breakdown
router.get('/incidents-by-priority', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const data = await Incident.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/incidents-over-time — Line chart: daily counts for last 30 days
router.get('/incidents-over-time', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const data = await Incident.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/heatmap — All incident coordinates for heatmap
router.get('/heatmap', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const incidents = await Incident.find({}).select('location priority type createdAt');
    const points = incidents.map(i => ({
      lat: i.location.coordinates[1],
      lng: i.location.coordinates[0],
      priority: i.priority,
      type: i.type,
    }));
    res.json(points);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/response-times — Response time trend
router.get('/response-times', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const incidents = await Incident.find({
      status: 'resolved',
      dispatchedAt: { $exists: true },
      arrivedAt: { $exists: true },
    }).select('dispatchedAt arrivedAt priority type createdAt').limit(100).sort({ createdAt: -1 });

    const data = incidents.map(i => ({
      date: i.createdAt.toISOString().split('T')[0],
      responseMinutes: ((new Date(i.arrivedAt) - new Date(i.dispatchedAt)) / 60000).toFixed(1),
      priority: i.priority,
      type: i.type,
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
