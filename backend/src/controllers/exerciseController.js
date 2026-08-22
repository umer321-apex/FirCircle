const Exercise = require('../models/Exercise');
const User = require('../models/User');
const Workout = require('../models/Workout');
const { suggestWorkout } = require('../services/workoutSuggestionService');

const RECENT_HISTORY_DAYS = 5;

const getDateStringDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const VALID_SPLITS = [
  'Chest Day',
  'Back Day',
  'Leg Day',
  'Shoulder Day',
  'Arm Day',
  'Push Day',
  'Pull Day',
  'Legs Day',
];

// Every user — free or premium — can preview any exercise with its full
// goal-matched sets/reps/rest/calorie detail. No premium gating here.
const getExercises = async (req, res) => {
  try {
    const { split } = req.query;

    const query = {};
    if (split) {
      if (!VALID_SPLITS.includes(split)) {
        return res.status(400).json({
          message: `split must be one of: ${VALID_SPLITS.join(', ')}`,
        });
      }
      query.splitCategory = split;
    }

    // .lean() — this is a read-heavy, frequently-hit endpoint; skip the overhead
    // of full Mongoose documents since we don't need any instance methods here.
    const exercises = await Exercise.find(query).lean();

    const user = await User.findById(req.user._id).select('goal').lean();
    const goal = user?.goal || 'maintenance';

    // maintenance has no dedicated variant in the schema — fall back to cutting's
    // pacing as a sensible general-fitness default rather than crashing
    const variantKey = goal === 'bulking' ? 'bulking' : 'cutting';

    const matched = exercises.map((ex) => ({
      _id: ex._id,
      name: ex.name,
      splitCategory: ex.splitCategory,
      primaryMuscle: ex.primaryMuscle,
      imageUrl: ex.imageUrl,
      videoUrl: ex.videoUrl,
      variant: ex.variants[variantKey],
      matchedGoal: goal,
    }));

    return res.status(200).json({ exercises: matched });
  } catch (error) {
    console.error(`[exerciseController.getExercises] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching exercises' });
  }
};

// GET /api/exercises/suggestion?split=Chest%20Day
// Suggestion mode (mirrors cardioSuggestionService): picks a subset of the split's
// exercises sized by experience level, stopping once the bodyweight%-derived
// calorie target is met.
const getSuggestedWorkout = async (req, res) => {
  try {
    const { split } = req.query;

    if (!split || !VALID_SPLITS.includes(split)) {
      return res.status(400).json({
        message: `split is required and must be one of: ${VALID_SPLITS.join(', ')}`,
      });
    }

    const user = await User.findById(req.user._id).select('goal experienceLevel weightKg').lean();

    if (!user?.weightKg) {
      return res.status(400).json({
        message: 'Set your bodyweight in your profile to get a workout suggestion',
      });
    }

    const exercises = await Exercise.find({ splitCategory: split }).lean();
    if (exercises.length === 0) {
      return res.status(404).json({ message: `No exercises found for ${split}` });
    }

    // Recently-logged exercise names for this user — used to rotate the
    // suggestion away from exercises they just did, for variety.
    const recentWorkouts = await Workout.find({
      userId: req.user._id,
      date: { $gte: getDateStringDaysAgo(RECENT_HISTORY_DAYS) },
    })
      .select('entries.exerciseName')
      .lean();
    const recentlyLoggedNames = new Set(
      recentWorkouts.flatMap((w) => w.entries.map((e) => e.exerciseName))
    );

    const suggestion = suggestWorkout({
      exercises,
      goal: user.goal || 'maintenance',
      experienceLevel: user.experienceLevel || 'beginner',
      weightKg: user.weightKg,
      recentlyLoggedNames,
    });

    return res.status(200).json({ suggestion });
  } catch (error) {
    console.error(`[exerciseController.getSuggestedWorkout] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error generating workout suggestion' });
  }
};

module.exports = { getExercises, getSuggestedWorkout };
