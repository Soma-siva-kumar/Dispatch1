require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const unitRoutes = require('./routes/units');
const analyticsRoutes = require('./routes/analytics');
const voiceAgentRoutes = require('./routes/voiceAgent');
const placesRoutes = require('./routes/places');
const notificationRoutes = require('./routes/notifications');

const { initSocket } = require('./socket/socketHandler');
const escalationMonitor = require('./services/escalationMonitor');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'public')));
app.get('/ai-emergency-alert.mp3', (req, res) => {
  res.sendFile(path.join(__dirname, 'ai-emergency-alert.mp3'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/voice-agent', voiceAgentRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/notifications', notificationRoutes);


// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Root route details
app.get('/', (_, res) => res.json({
  message: "Dispatch IQ API Server is running successfully",
  health: "http://localhost:5000/api/health",
  frontendPortals: {
    citizenPortal: "http://localhost:5173",
    officerPortal: "http://localhost:5174",
    dispatcherPortal: "http://localhost:5175",
    adminPortal: "http://localhost:5176"
  }
}));

// Initialize Socket.IO events
initSocket(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dispatchiq';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 DispatchIQ Server running on http://localhost:${PORT}`);
      // Start escalation monitoring
      escalationMonitor.setIO(io);
      escalationMonitor.start();
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
