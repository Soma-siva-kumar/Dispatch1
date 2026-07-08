/**
 * Escalation Monitor
 * Background service that detects unacknowledged dispatches and slow responses
 */

const Incident = require('../models/Incident');
const PatrolUnit = require('../models/PatrolUnit');

// Zone average response times in minutes (configurable)
const ZONE_AVERAGES = {
  default: 8,
  'Zone-A': 6,
  'Zone-B': 7,
  'Zone-C': 10,
  'Zone-D': 12,
};

// Unacknowledged dispatch timeout: 2 minutes
const ACK_TIMEOUT_MS = 2 * 60 * 1000;

// Response time anomaly: 2× zone average
const RESPONSE_ANOMALY_MULTIPLIER = 2;

let io = null;
let intervalHandle = null;

function setIO(socketIO) {
  io = socketIO;
}

async function runEscalationCheck() {
  const now = new Date();

  try {
    // 1. Find dispatched incidents where unit hasn't gone "en_route" within timeout
    const stalledDispatches = await Incident.find({
      status: 'dispatched',
      dispatchedAt: { $lt: new Date(now - ACK_TIMEOUT_MS) },
      escalated: { $ne: true },
    }).populate('assignedUnit');

    for (const incident of stalledDispatches) {
      incident.escalated = true;
      incident.escalationReason = `Unit ${incident.assignedUnit?.unitId || 'Unknown'} did not acknowledge dispatch within 2 minutes`;
      incident.timeline.push({
        status: 'escalated',
        note: incident.escalationReason,
        timestamp: now,
      });
      await incident.save();

      if (io) {
        io.emit('escalation:alert', {
          type: 'no_acknowledgment',
          incident: incident.toObject(),
          message: `⚠️ ESCALATION: Unit ${incident.assignedUnit?.unitId} has not acknowledged dispatch for incident: ${incident.title}`,
          severity: 'high',
          timestamp: now,
        });
      }
      console.log(`[ESCALATION] Stalled dispatch: ${incident.title}`);
    }

    // 2. Find en_route incidents taking too long
    const enRouteIncidents = await Incident.find({
      status: 'en_route',
      dispatchedAt: { $exists: true },
    }).populate('assignedUnit');

    for (const incident of enRouteIncidents) {
      const unit = incident.assignedUnit;
      const zone = unit?.zone || 'default';
      const avgMinutes = ZONE_AVERAGES[zone] || ZONE_AVERAGES.default;
      const timeoutMs = avgMinutes * RESPONSE_ANOMALY_MULTIPLIER * 60 * 1000;
      const elapsed = now - new Date(incident.dispatchedAt);

      if (elapsed > timeoutMs && !incident.escalated) {
        incident.escalated = true;
        incident.escalationReason = `Response time (${Math.round(elapsed / 60000)} min) exceeds 2× zone average (${avgMinutes} min)`;
        incident.timeline.push({
          status: 'escalated',
          note: incident.escalationReason,
          timestamp: now,
        });
        await incident.save();

        if (io) {
          io.emit('escalation:alert', {
            type: 'slow_response',
            incident: incident.toObject(),
            message: `⚠️ ESCALATION: Incident "${incident.title}" response taking ${Math.round(elapsed / 60000)} min (zone avg: ${avgMinutes} min)`,
            severity: 'medium',
            timestamp: now,
          });
        }
        console.log(`[ESCALATION] Slow response: ${incident.title}`);
      }
    }
  } catch (err) {
    console.error('[EscalationMonitor] Error:', err.message);
  }
}

function start() {
  if (intervalHandle) return;
  console.log('[EscalationMonitor] Started — checking every 30s');
  intervalHandle = setInterval(runEscalationCheck, 30 * 1000);
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[EscalationMonitor] Stopped');
  }
}

module.exports = { start, stop, setIO, runEscalationCheck };
