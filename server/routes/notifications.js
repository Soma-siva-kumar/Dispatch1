const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { serializeNotification } = require('../services/notificationService');

router.get('/', auth(['dispatcher', 'officer']), async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications.map(serializeNotification));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/read', auth(['dispatcher', 'officer']), async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(serializeNotification(notification));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/read-all', auth(['dispatcher', 'officer']), async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications.map(serializeNotification));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/', auth(['dispatcher', 'officer']), async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ message: 'Notifications cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
