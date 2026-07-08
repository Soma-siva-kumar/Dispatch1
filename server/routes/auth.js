const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PatrolUnit = require('../models/PatrolUnit');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'citizen', phone, badgeNumber } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    let user = await User.create({ name, email, password, role, phone, badgeNumber });

    if (role === 'officer') {
      try {
        const patrolUnit = await PatrolUnit.create({
          unitId: `PCR-${badgeNumber || Math.floor(1000 + Math.random() * 9000)}`,
          officerName: name,
          officerBadge: badgeNumber,
          assignedOfficer: user._id,
          status: 'available',
          vehicleType: 'patrol_car',
          location: {
            type: 'Point',
            coordinates: [
              78.4867 + (Math.random() - 0.5) * 0.05,
              17.3850 + (Math.random() - 0.5) * 0.05
            ]
          }
        });
        user.assignedUnit = patrolUnit._id;
        await user.save();
      } catch (err) {
        console.error('Failed to create patrol unit for officer during registration:', err.message);
      }
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, assignedUnit: user.assignedUnit },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, assignedUnit: user.assignedUnit },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('assignedUnit');
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// GET /api/auth — List all users (admin and dispatcher only)
router.get('/', auth(['admin', 'dispatcher']), async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('assignedUnit');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/:id — Update user details (admin only)
router.patch('/:id', auth(['admin']), async (req, res) => {
  try {
    const { name, email, role, phone, badgeNumber, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (badgeNumber) user.badgeNumber = badgeNumber;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // If role changed to officer, create PatrolUnit if not exists
    if (role === 'officer' && !user.assignedUnit) {
      try {
        const patrolUnit = await PatrolUnit.create({
          unitId: `PCR-${badgeNumber || Math.floor(1000 + Math.random() * 9000)}`,
          officerName: user.name,
          officerBadge: badgeNumber,
          assignedOfficer: user._id,
          status: 'available',
          vehicleType: 'patrol_car',
          location: {
            type: 'Point',
            coordinates: [
              78.4867 + (Math.random() - 0.5) * 0.05,
              17.3850 + (Math.random() - 0.5) * 0.05
            ]
          }
        });
        user.assignedUnit = patrolUnit._id;
        await user.save();
      } catch (err) {
        console.error('Failed to create patrol unit for updated officer:', err.message);
      }
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/:id — Delete user (admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Also delete their patrol unit if they are an officer
    if (user.assignedUnit) {
      await PatrolUnit.findByIdAndDelete(user.assignedUnit);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
