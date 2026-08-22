// Experience level -> how many exercises to include (volume) + a calorie
// target as a percentage of bodyweight, same pattern as cardioSuggestionService.
const EXPERIENCE_PROFILE = {
  beginner: { maxExercises: 3, calorieTargetPctOfBodyweight: 0.03 },
  intermediate: { maxExercises: 4, calorieTargetPctOfBodyweight: 0.05 },
  advanced: { maxExercises: 6, calorieTargetPctOfBodyweight: 0.07 },
};

/**
 * Suggests a subset of a split's exercises, sized by experience level, stopping
 * once the bodyweight%-derived calorie target is met (or the experience-level's
 * exercise cap is reached, or the split runs out of exercises — whichever first).
 *
 * Exercises the user already logged recently are pushed to the back of the
 * candidate order (not excluded outright — if the split is small, repeating one
 * is still better than an empty workout), so the suggestion naturally rotates.
 *
 * @param {Object} params
 * @param {Array} params.exercises - Exercise docs (lean) for one splitCategory
 * @param {String} params.goal - 'cutting' | 'bulking' | 'maintenance'
 * @param {String} params.experienceLevel - 'beginner' | 'intermediate' | 'advanced'
 * @param {Number} params.weightKg
 * @param {Set<String>} [params.recentlyLoggedNames] - exercise names logged in the last few days
 */
const suggestWorkout = ({ exercises, goal, experienceLevel, weightKg, recentlyLoggedNames }) => {
  const profile = EXPERIENCE_PROFILE[experienceLevel] || EXPERIENCE_PROFILE.beginner;
  const variantKey = goal === 'bulking' ? 'bulking' : 'cutting'; // maintenance falls back to cutting's pacing, same as getExercises

  const targetCalories = weightKg * profile.calorieTargetPctOfBodyweight;

  const recent = recentlyLoggedNames || new Set();
  const freshFirst = [...exercises].sort((a, b) => {
    const aRecent = recent.has(a.name) ? 1 : 0;
    const bRecent = recent.has(b.name) ? 1 : 0;
    return aRecent - bRecent; // fresh (0) before recently-logged (1), stable otherwise
  });

  const picked = [];
  let accumulatedCalories = 0;

  for (const ex of freshFirst) {
    if (picked.length >= profile.maxExercises) break;
    if (picked.length >= 2 && accumulatedCalories >= targetCalories) break;

    const variant = ex.variants[variantKey];
    picked.push({
      _id: ex._id,
      name: ex.name,
      splitCategory: ex.splitCategory,
      primaryMuscle: ex.primaryMuscle,
      imageUrl: ex.imageUrl,
      videoUrl: ex.videoUrl,
      variant,
      matchedGoal: goal,
      recentlyLogged: recent.has(ex.name),
    });
    accumulatedCalories += variant.sets * variant.caloriesPerSet;
  }

  const estimatedCalories = Math.round(accumulatedCalories);
  const rotatedCount = picked.filter((ex) => !ex.recentlyLogged).length;
  const rotationNote =
    recent.size > 0 && rotatedCount > 0
      ? ` Prioritized ${rotatedCount} exercise${rotatedCount === 1 ? '' : 's'} you haven't logged in the last few days for variety.`
      : '';

  return {
    splitCategory: exercises[0]?.splitCategory,
    experienceLevel,
    exercises: picked,
    estimatedCalories,
    reason: `As a ${experienceLevel}, ${picked.length} exercises at ${goal === 'bulking' ? 'heavier, lower-rep' : 'higher-rep, shorter-rest'} pacing targets roughly ${estimatedCalories} kcal (~${(profile.calorieTargetPctOfBodyweight * 100).toFixed(1)}% of your bodyweight) for this session.${rotationNote}`,
  };
};

module.exports = { suggestWorkout, EXPERIENCE_PROFILE };
