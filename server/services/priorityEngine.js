/**
 * AI Priority Engine
 * Scores incoming incidents and assigns P1/P2/P3/P4 priority
 */

const TYPE_WEIGHTS = {
  shooting: 100,
  assault: 85,
  domestic_violence: 80,
  robbery: 75,
  fire: 90,
  medical: 88,
  accident: 60,
  theft: 40,
  suspicious: 35,
  vandalism: 25,
  noise: 10,
  other: 20,
};

const SEVERITY_KEYWORDS = {
  high: ['gun', 'knife', 'weapon', 'stabbing', 'shooting', 'blood', 'unconscious', 'not breathing', 'fire', 'dead', 'dying', 'hostage', 'explosion'],
  medium: ['injury', 'injured', 'fight', 'threat', 'breaking', 'forced entry', 'chasing', 'screaming'],
  low: ['suspicious', 'argument', 'loud', 'drunk'],
};

/**
 * Calculate hour-of-day risk multiplier
 * Late night / early morning = higher risk
 */
function getTimeMultiplier() {
  const hour = new Date().getHours();
  if (hour >= 22 || hour <= 4) return 1.3;   // Night: 10pm–4am
  if (hour >= 18 && hour < 22) return 1.1;   // Evening
  if (hour >= 5 && hour < 8) return 1.05;    // Early morning
  return 1.0;                                  // Daytime
}

/**
 * Score keywords in description
 */
function scoreKeywords(description = '') {
  const lower = description.toLowerCase();
  let score = 0;
  SEVERITY_KEYWORDS.high.forEach(kw => { if (lower.includes(kw)) score += 30; });
  SEVERITY_KEYWORDS.medium.forEach(kw => { if (lower.includes(kw)) score += 15; });
  SEVERITY_KEYWORDS.low.forEach(kw => { if (lower.includes(kw)) score += 5; });
  return score;
}

/**
 * Main priority scoring function
 * @param {Object} incident - { type, description, weaponInvolved, peopleAffected }
 * @returns {{ priority: string, score: number }}
 */
function scoreIncident(incident) {
  const { type, description, weaponInvolved, peopleAffected = 1 } = incident;

  let score = TYPE_WEIGHTS[type] || TYPE_WEIGHTS.other;

  // Keyword scoring
  score += scoreKeywords(description);

  // Weapon bonus
  if (weaponInvolved) score += 40;

  // People affected multiplier
  if (peopleAffected > 10) score += 30;
  else if (peopleAffected > 5) score += 20;
  else if (peopleAffected > 2) score += 10;

  // Time of day multiplier
  score = Math.round(score * getTimeMultiplier());

  // Cap at 200
  score = Math.min(score, 200);

  // Map score to priority
  let priority;
  if (score >= 130) priority = 'P1';
  else if (score >= 80) priority = 'P2';
  else if (score >= 40) priority = 'P3';
  else priority = 'P4';

  return { priority, score };
}

module.exports = { scoreIncident };
