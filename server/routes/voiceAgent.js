const express = require('express');
const router = express.Router();

// POST /api/voice-agent — Receive voice agent call request (no auth — public endpoint)
// Accepts: { mobile, coordinates [lng,lat], address }
// Emits: socket event 'voiceAgent:call' to all dispatchers/admins
router.post('/initiate', async (req, res) => {
  try {
    const { mobile, coordinates, address } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required.' });
    }

    // Validate mobile — India format (10 digits, optionally prefixed with +91)
    const cleaned = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^\d{10}$/.test(cleaned)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    const payload = {
      mobile: cleaned,
      coordinates: coordinates || null,  // [lng, lat]
      address: address || 'Location not provided',
      requestedAt: new Date().toISOString(),
      type: 'voice_agent_call',
    };

    // Emit real-time alert to all connected dispatchers/admins
    const io = req.app.get('io');
    if (io) {
      io.emit('voiceAgent:call', payload);
    }

    return res.status(200).json({
      message: 'Voice agent request received. A dispatcher has been notified.',
      payload,
    });
  } catch (err) {
    console.error('[VoiceAgent]', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
