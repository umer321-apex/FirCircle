const Exercise = require('../models/Exercise');
const User = require('../models/User');

const VALID_SPLITS = ['Chest Day', 'Back Day', 'Leg Day', 'Shoulder Day', 'Arm Day'];

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

    if (!req.isPremiumUser) {
      // FR-3.5: Free users see the generic list only — strip goal-matched variant data
      const stripped = exercises.map((ex) => ({
        _id: ex._id,
        name: ex.name,
        splitCategory: ex.splitCategory,
        primaryMuscle: ex.primaryMuscle,
        premiumLocked: true,
      }));
      return res.status(200).json({ exercises: stripped, isPremium: false });
    }

    // Premium: fetch the user's goal and attach the matching variant per exercise
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
      variant: ex.variants[variantKey],
      matchedGoal: goal,
      premiumLocked: false,
    }));

    return res.status(200).json({ exercises: matched, isPremium: true });
  } catch (error) {
    console.error(`[exerciseController.getExercises] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching exercises' });
  }
};

module.exports = { getExercises };