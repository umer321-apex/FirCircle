const CardioActivity = require('../models/CardioActivity');

// Experience level -> intensity band + duration range + calorie target as a
// percentage of the user's bodyweight (kcal target = weightKg * pct).
// Tunable table, not magic numbers inline — matches the plan's requirement.
const EXPERIENCE_PROFILE = {
  beginner: { intensity: 'low', minDurationMinutes: 15, maxDurationMinutes: 20, calorieTargetPctOfBodyweight: 0.01 },
  intermediate: { intensity: 'moderate', minDurationMinutes: 20, maxDurationMinutes: 30, calorieTargetPctOfBodyweight: 0.015 },
  advanced: { intensity: 'high', minDurationMinutes: 30, maxDurationMinutes: 45, calorieTargetPctOfBodyweight: 0.02 },
};

/**
 * Suggests a single cardio activity + duration + intensity for a user, based on
 * their experienceLevel (drives intensity/duration) and weightKg (drives the
 * calorie target). Picks whichever catalog activity gets closest to the target
 * calorie burn within the experience-level's duration range.
 *
 * @param {Object} user - { experienceLevel, weightKg }
 * @param {Set<String>} [recentActivityNames] - activities logged in the last day or two,
 *   deprioritized (not excluded) so the suggestion rotates instead of repeating.
 */
const suggestCardio = async (user, recentActivityNames) => {
  const experienceLevel = user?.experienceLevel || 'beginner';
  const weightKg = user?.weightKg;
  const recent = recentActivityNames || new Set();

  if (!weightKg) {
    throw new Error('User must have a weightKg set to receive a cardio suggestion');
  }

  const profile = EXPERIENCE_PROFILE[experienceLevel] || EXPERIENCE_PROFILE.beginner;
  const targetCalories = weightKg * profile.calorieTargetPctOfBodyweight;

  const activities = await CardioActivity.find({}).lean();
  if (activities.length === 0) {
    throw new Error('No cardio activities available to suggest from');
  }

  // Use the midpoint of the experience-level's duration range as the reference
  // duration when scoring each activity's calorie output against the target.
  const referenceDuration = (profile.minDurationMinutes + profile.maxDurationMinutes) / 2;

  // Score every activity, then prefer the best-scoring one that wasn't recently
  // logged — falling back to the overall best if everything's been done recently.
  const scored = activities
    .map((activity) => ({
      activity,
      diff: Math.abs(activity.caloriesPerMinutePerKg * weightKg * referenceDuration - targetCalories),
    }))
    .sort((a, b) => a.diff - b.diff);

  const bestFresh = scored.find((s) => !recent.has(s.activity.name));
  const best = (bestFresh || scored[0]).activity;
  const wasRotated = !!bestFresh && recent.has(scored[0].activity.name) && bestFresh.activity.name !== scored[0].activity.name;

  const guidance = best.intensityLevels[profile.intensity];
  const durationMinutes = Math.round((guidance.minDurationMinutes + guidance.maxDurationMinutes) / 2);
  const estimatedCalories = Math.round(best.caloriesPerMinutePerKg * weightKg * durationMinutes);

  return {
    activityName: best.name,
    intensity: profile.intensity,
    durationMinutes,
    estimatedCalories,
    imageUrl: best.imageUrl,
    videoUrl: best.videoUrl,
    reason: `As a ${experienceLevel}, ${profile.intensity} intensity for about ${durationMinutes} minutes of ${best.name} targets roughly ${estimatedCalories} kcal (~${(profile.calorieTargetPctOfBodyweight * 100).toFixed(1)}% of your bodyweight) — ${guidance.description}${wasRotated ? ' Picked a different activity than your last session for variety.' : ''}`,
  };
};

module.exports = { suggestCardio, EXPERIENCE_PROFILE };
