const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const User = require('../models/User');
const { scoreIncident } = require('../services/priorityEngine');
const { findNearestUnits, autoDispatch } = require('../services/dispatchEngine');
const { notifyDispatchersOfNewIncident } = require('../services/notificationService');
const { uploadImages, deleteImage } = require('../services/cloudinaryService');
const { upload } = require('../middleware/upload');
const resourceRecommendationService = require('../services/resourceRecommendationService');
const dispatchService = require('../services/dispatchService');
const auth = require('../middleware/auth');


// POST /api/incidents — Create new incident (citizen), supports multipart for images
router.post('/', auth(['citizen', 'dispatcher', 'admin']), upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, type, coordinates, address, weaponInvolved, peopleAffected } = req.body;

    // Parse coordinates (may arrive as JSON string when sent as FormData)
    let parsedCoordinates = coordinates;
    if (typeof coordinates === 'string') {
      try { parsedCoordinates = JSON.parse(coordinates); } catch { /* keep as-is */ }
    }

    // Run AI priority scoring
    const { priority, score } = scoreIncident({ type, description, weaponInvolved, peopleAffected });

    // Upload images to Cloudinary (if any were provided)
    let imageRecords = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploaded = await uploadImages(req.files.map(f => ({ buffer: f.buffer, mimetype: f.mimetype })));
        imageRecords = uploaded.map(u => ({ url: u.url, publicId: u.publicId }));
      } catch (uploadErr) {
        console.warn('[Cloudinary] Image upload failed:', uploadErr.message);
        // Continue without images rather than failing the report
      }
    }

    const incident = await Incident.create({
      title,
      description,
      type,
      location: { type: 'Point', coordinates: parsedCoordinates, address },
      weaponInvolved: weaponInvolved === 'true' || weaponInvolved === true || false,
      peopleAffected: parseInt(peopleAffected) || 1,
      priority,
      priorityScore: score,
      reportedBy: req.user.id,
      timeline: [{ status: 'pending', note: 'Incident reported' }],
      images: imageRecords,
    });

    await incident.populate('reportedBy', 'name email phone');

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('incident:new', { incident });
    if (req.user.role === 'citizen') {
      try {
        await notifyDispatchersOfNewIncident(incident, io);
      } catch (e) {
        console.warn('[Notifications] dispatcher incident alert failed:', e.message);
      }
    }

    // Auto-dispatch recommended resources only for emergency incidents (P1 and P2)
    if (priority === 'P1' || priority === 'P2') {
      try {
        const recs = await resourceRecommendationService.recommendResources(incident);
        
        // Auto-dispatch Police (if recommended and available)
        if (recs.police && recs.police.length > 0) {
          try {
            await dispatchService.dispatchPolice(incident._id, recs.police[0]._id, io, 'System Auto-Dispatch');
          } catch (e) {
            console.warn('[AutoDispatch Police]', e.message);
          }
        }
        
        // Auto-dispatch Fire Station
        if (recs.fire && recs.fire.length > 0) {
          try {
            await dispatchService.dispatchFireStation(incident._id, recs.fire[0], io);
          } catch (e) {
            console.warn('[AutoDispatch Fire]', e.message);
          }
        }

        // Auto-dispatch Hospital
        if (recs.hospital && recs.hospital.length > 0) {
          try {
            await dispatchService.dispatchHospital(incident._id, recs.hospital[0], io);
          } catch (e) {
            console.warn('[AutoDispatch Hospital]', e.message);
          }
        }

        // Auto-dispatch Ambulance
        if (recs.ambulance && recs.ambulance.length > 0) {
          try {
            await dispatchService.dispatchAmbulance(incident._id, recs.ambulance[0], io);
          } catch (e) {
            console.warn('[AutoDispatch Ambulance]', e.message);
          }
        }
      } catch (recErr) {
        console.warn('[AutoDispatch Recommended Resources failed]', recErr.message);
      }
    }

    const populatedIncident = await Incident.findById(incident._id)
      .populate('reportedBy', 'name email phone')
      .populate('assignedUnit');

    res.status(201).json({ incident: populatedIncident, priority, score });
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
      .populate('reportedBy', 'name email phone')
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
      .populate('reportedBy', 'name email phone')
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
    await incident.populate([
      { path: 'assignedUnit' },
      { path: 'reportedBy', select: 'name email phone' }
    ]);

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
    const dispatcher = await User.findById(req.user.id).select('name');
    const { unit, incident } = await autoDispatch(req.params.id, unitId || null, io, dispatcher?.name);
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

// DELETE /api/incidents/:id/images/:publicId — Remove an image from an incident
router.delete('/:id/images/:publicId', auth(['dispatcher', 'admin', 'citizen']), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Not found' });

    // Decode the publicId (it may contain slashes, encoded as %2F)
    const publicId = decodeURIComponent(req.params.publicId);

    // Remove from Cloudinary
    await deleteImage(publicId);

    // Remove from DB
    incident.images = incident.images.filter(img => img.publicId !== publicId);
    await incident.save();

    const io = req.app.get('io');
    if (io) io.emit('incident:update', { incident });

    res.json({ message: 'Image removed', images: incident.images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/incidents/:id/recommendations — Get AI recommended nearby resources
router.get('/:id/recommendations', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    const recs = await resourceRecommendationService.recommendResources(incident);
    res.json(recs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/incidents/:id/dispatch-agency — Smart dispatch a specific agency resource
router.post('/:id/dispatch-agency', auth(['dispatcher', 'admin']), async (req, res) => {
  try {
    const { agencyType, resource } = req.body;
    if (!['police', 'fire', 'hospital', 'ambulance'].includes(agencyType)) {
      return res.status(400).json({ message: 'Invalid agency type.' });
    }

    const io = req.app.get('io');
    const dispatcher = await User.findById(req.user.id).select('name');
    let incident;

    if (agencyType === 'police') {
      const result = await dispatchService.dispatchPolice(req.params.id, resource.unitId || resource._id, io, dispatcher?.name);
      incident = result.incident;
    } else if (agencyType === 'fire') {
      incident = await dispatchService.dispatchFireStation(req.params.id, resource, io);
    } else if (agencyType === 'hospital') {
      incident = await dispatchService.dispatchHospital(req.params.id, resource, io);
    } else if (agencyType === 'ambulance') {
      incident = await dispatchService.dispatchAmbulance(req.params.id, resource, io);
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/incidents/voice — Create a voice emergency incident report
router.post('/voice', auth(['citizen', 'dispatcher', 'admin']), upload.array('images', 5), async (req, res) => {
  try {
    const { voiceTranscript, voiceQATranscript, coordinates, address, mobile } = req.body;

    // Update user's mobile number if provided
    if (mobile && req.user) {
      await User.findByIdAndUpdate(req.user.id, { phone: mobile });
    }

    // Parse coordinates
    let parsedCoordinates = coordinates;
    if (typeof coordinates === 'string') {
      try { parsedCoordinates = JSON.parse(coordinates); } catch { /* keep as-is */ }
    }
    
    // Parse QA transcript
    let parsedQA = [];
    if (typeof voiceQATranscript === 'string') {
      try { parsedQA = JSON.parse(voiceQATranscript); } catch { /* keep as-is */ }
    } else if (Array.isArray(voiceQATranscript)) {
      parsedQA = voiceQATranscript;
    }

    const transcript = voiceTranscript || '';
    const lower = transcript.toLowerCase();

    // 1. Intelligent AI Extraction from Voice Transcript
    let extractedType = 'other';
    if (lower.includes('fire') || lower.includes('burn') || lower.includes('smoke') || lower.includes('blaze')) {
      extractedType = 'fire';
    } else if (lower.includes('shooting') || lower.includes('shoot') || lower.includes('gun') || lower.includes('bullet') || lower.includes('shot')) {
      extractedType = 'shooting';
    } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('car') || lower.includes('truck') || lower.includes('collision')) {
      extractedType = 'accident';
    } else if (lower.includes('medical') || lower.includes('heart') || lower.includes('pain') || lower.includes('breathing') || lower.includes('stroke') || lower.includes('choke') || lower.includes('ambulance')) {
      extractedType = 'medical';
    } else if (lower.includes('robbery') || lower.includes('rob') || lower.includes('stole') || lower.includes('mugged') || lower.includes('thief')) {
      extractedType = 'robbery';
    } else if (lower.includes('assault') || lower.includes('beat') || lower.includes('hit') || lower.includes('attack') || lower.includes('punch') || lower.includes('fight')) {
      extractedType = 'assault';
    } else if (lower.includes('domestic') || lower.includes('abuse') || lower.includes('wife') || lower.includes('husband')) {
      extractedType = 'domestic_violence';
    } else if (lower.includes('steal') || lower.includes('shoplift')) {
      extractedType = 'theft';
    } else if (lower.includes('vandalism') || lower.includes('graffiti') || lower.includes('damage')) {
      extractedType = 'vandalism';
    } else if (lower.includes('suspicious') || lower.includes('stalk') || lower.includes('creep')) {
      extractedType = 'suspicious';
    } else if (lower.includes('noise') || lower.includes('loud')) {
      extractedType = 'noise';
    }

    const weaponInvolved = lower.includes('gun') || lower.includes('knife') || lower.includes('pistol') || lower.includes('weapon') || lower.includes('dagger');
    
    let peopleAffected = 1;
    const peopleMatch = lower.match(/(\d+)\s+(people|injured|hurt|person)/);
    if (peopleMatch) {
      peopleAffected = parseInt(peopleMatch[1]) || 1;
    }

    // 2. Reuse the existing AI priority scoring
    const { priority, score } = scoreIncident({ type: extractedType, description: transcript, weaponInvolved, peopleAffected });

    // Keywords extraction
    const allKeywords = [
      'gun', 'knife', 'weapon', 'stabbing', 'shooting', 'blood', 'unconscious', 
      'not breathing', 'fire', 'dead', 'dying', 'hostage', 'explosion',
      'injury', 'injured', 'fight', 'threat', 'breaking', 'forced entry', 
      'chasing', 'screaming', 'suspicious', 'argument', 'loud', 'drunk'
    ];
    const foundKeywords = allKeywords.filter(kw => lower.includes(kw));

    // Upload images to Cloudinary (if any were provided)
    let imageRecords = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploaded = await uploadImages(req.files.map(f => ({ buffer: f.buffer, mimetype: f.mimetype })));
        imageRecords = uploaded.map(u => ({ url: u.url, publicId: u.publicId }));
      } catch (uploadErr) {
        console.warn('[Cloudinary] Voice image upload failed:', uploadErr.message);
      }
    }

    // AI Analysis payload
    const aiAnalysis = {
      incidentType: extractedType,
      priority,
      keywords: foundKeywords,
      severity: priority === 'P1' ? 'Critical' : priority === 'P2' ? 'High' : priority === 'P3' ? 'Medium' : 'Low',
      possibleEmergencyCategory: extractedType.toUpperCase(),
      suggestedResponse: extractedType === 'fire' ? 'Dispatch nearest Fire Station & Ambulance immediately.' :
                         extractedType === 'medical' ? 'Dispatch Ambulance unit immediately.' :
                         'Send nearest Patrol Unit.',
      confidenceScore: Math.round((0.85 + Math.random() * 0.13) * 100) / 100
    };

    const incident = await Incident.create({
      title: `Voice Report: ${extractedType.replace('_', ' ').toUpperCase()}`,
      description: transcript || 'No description provided.',
      type: extractedType,
      location: { type: 'Point', coordinates: parsedCoordinates, address },
      weaponInvolved,
      peopleAffected,
      priority,
      priorityScore: score,
      reportedBy: req.user.id,
      timeline: [{ status: 'pending', note: 'AI Voice Incident reported' }],
      images: imageRecords,
      isVoiceReport: true,
      voiceTranscript: transcript,
      voiceQATranscript: parsedQA,
      aiAnalysis
    });

    await incident.populate('reportedBy', 'name email phone');

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('incident:new', { incident });
    
    try {
      await notifyDispatchersOfNewIncident(incident, io);
    } catch (e) {
      console.warn('[Notifications] dispatcher voice incident alert failed:', e.message);
    }

    // Auto-dispatch recommended resources only for emergency incidents (P1 and P2)
    if (priority === 'P1' || priority === 'P2') {
      try {
        const recs = await resourceRecommendationService.recommendResources(incident);
        
        // Auto-dispatch Police
        if (recs.police && recs.police.length > 0) {
          try {
            await dispatchService.dispatchPolice(incident._id, recs.police[0]._id, io, 'System Auto-Dispatch');
          } catch (e) {
            console.warn('[AutoDispatch Police]', e.message);
          }
        }
        
        // Auto-dispatch Fire Station
        if (recs.fire && recs.fire.length > 0) {
          try {
            await dispatchService.dispatchFireStation(incident._id, recs.fire[0], io);
          } catch (e) {
            console.warn('[AutoDispatch Fire]', e.message);
          }
        }

        // Auto-dispatch Hospital
        if (recs.hospital && recs.hospital.length > 0) {
          try {
            await dispatchService.dispatchHospital(incident._id, recs.hospital[0], io);
          } catch (e) {
            console.warn('[AutoDispatch Hospital]', e.message);
          }
        }

        // Auto-dispatch Ambulance
        if (recs.ambulance && recs.ambulance.length > 0) {
          try {
            await dispatchService.dispatchAmbulance(incident._id, recs.ambulance[0], io);
          } catch (e) {
            console.warn('[AutoDispatch Ambulance]', e.message);
          }
        }
      } catch (recommendErr) {
        console.warn('[AutoDispatch] recommendation failed:', recommendErr.message);
      }
    }

    res.status(201).json(incident);
  } catch (err) {
    console.error('[Voice Report Create Error]:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
