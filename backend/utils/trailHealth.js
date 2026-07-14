// trailHealth.js — computes a composite 0-100 "Trail Health Score" for a trail.
//
// Health Score = (0.45 × Freshness Score) + (0.55 × Risk Score)
//
// Freshness Score: decays the longer it's been since the trail was last
// confirmed fresh by a visitor. Mirrors the existing decay tiers used
// elsewhere in the app (90-day and 180-day thresholds).
//
// Risk Score: weighted average of the most recent comments' NLP risk
// classification, with more recent comments weighted more heavily than
// older ones (recency-weighted average).

function calculateFreshnessScore(lastConfirmedDate) {
  const days = Math.floor((Date.now() - new Date(lastConfirmedDate)) / (1000 * 60 * 60 * 24));

  if (days <= 90) {
    // 100 at day 0, tapering to 80 at day 90
    return 100 - (days / 90) * 20;
  }
  if (days <= 180) {
    // 80 at day 90, tapering to 40 at day 180
    return 80 - ((days - 90) / 90) * 40;
  }
  // 40 at day 180, tapering to 0 by day 360, clamped at 0
  const score = 40 - ((days - 180) / 180) * 40;
  return Math.max(0, score);
}

function calculateRiskScore(comments) {
  if (!comments || comments.length === 0) {
    // No visitor reports yet — neutral-positive default, not a perfect score,
    // since there's no evidence either way.
    return 90;
  }

  const riskPoints = { clear: 100, caution: 50, needs_review: 0 };

  // Most recent 5 comments, newest first
  const recent = [...comments]
    .filter(c => c.nlpRisk) // only comments that were actually NLP-scored
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recent.length === 0) return 90;

  let weightedSum = 0;
  let totalWeight = 0;
  recent.forEach((comment, index) => {
    const weight = 1 / (index + 1); // newest = weight 1, next = 0.5, next = 0.33...
    const points = riskPoints[comment.nlpRisk] ?? 70;
    weightedSum += points * weight;
    totalWeight += weight;
  });

  return weightedSum / totalWeight;
}

function getHealthLabel(score) {
  if (score >= 80) return { label: 'Excellent', color: '#27500A', bg: '#EAF3DE' };
  if (score >= 60) return { label: 'Good', color: '#4A7C1F', bg: '#F0F7E8' };
  if (score >= 40) return { label: 'Fair', color: '#854F0B', bg: '#FAEEDA' };
  if (score >= 20) return { label: 'Poor', color: '#B5622C', bg: '#FBE9DD' };
  return { label: 'Critical', color: '#A32D2D', bg: '#FCEBEB' };
}

function calculateHealthScore(trail) {
  const freshnessScore = calculateFreshnessScore(trail.lastConfirmedDate);
  const riskScore = calculateRiskScore(trail.comments);

  const healthScore = Math.round(0.45 * freshnessScore + 0.55 * riskScore);
  const { label, color, bg } = getHealthLabel(healthScore);

  return {
    score: healthScore,
    label,
    color,
    bg,
    breakdown: {
      freshnessScore: Math.round(freshnessScore),
      riskScore: Math.round(riskScore)
    }
  };
}

module.exports = { calculateHealthScore };