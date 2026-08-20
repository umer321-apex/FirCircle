const Workout = require('../models/Workout');

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const logWorkout = async (req, res) => {
  try {
    const { splitCategory, entries } = req.body;

    if (!splitCategory) {
      return res.status(400).json({ message: 'splitCategory is required' });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'At least one exercise entry is required' });
    }

    // Validate + compute volume server-side — never trust a client-sent volume total
    const processedEntries = [];
    let totalVolume = 0;

    for (const entry of entries) {
      const { exerciseId, exerciseName, sets, reps, weightKg } = entry;

      if (!exerciseId || !exerciseName || !sets || !reps || weightKg === undefined) {
        return res.status(400).json({
          message: 'Each entry requires exerciseId, exerciseName, sets, reps, and weightKg',
        });
      }

      const volume = sets * reps * weightKg;
      totalVolume += volume;

      processedEntries.push({ exerciseId, exerciseName, sets, reps, weightKg, volume });
    }

    const workout = await Workout.create({
      userId: req.user._id,
      date: getTodayDateString(),
      splitCategory,
      entries: processedEntries,
      totalVolume,
    });

    return res.status(201).json({ workout });
  } catch (error) {
    console.error(`[workoutController.logWorkout] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error logging workout' });
  }
};

const getMyWorkouts = async (req, res) => {
  try {
    // Capped + sorted — keeps this fast for long-time users with hundreds of logged sessions
    const workouts = await Workout.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ workouts });
  } catch (error) {
    console.error(`[workoutController.getMyWorkouts] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching workouts' });
  }
};

module.exports = { logWorkout, getMyWorkouts };