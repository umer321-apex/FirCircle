const GymCheckIn = require('../models/GymCheckIn');
const Workout = require('../models/Workout');
const MealPlan = require('../models/MealPlan');

const DAYS_LOOKBACK = 7;

function startOfDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

// GET /api/insights/weekly
exports.getWeeklyInsight = async (req, res) => {
  try {
    const userId = req.user.id;
    const since = startOfDaysAgo(DAYS_LOOKBACK);

    const [checkIns, workouts, mealPlans] = await Promise.all([
      GymCheckIn.find({ userId, date: { $gte: since } }),
      Workout.find({ userId, date: { $gte: since } }),
      MealPlan.find({ userId, date: { $gte: since } }),
    ]);

    // --- Consistency ---
    const daysCheckedIn = new Set(
      checkIns.map((c) => new Date(c.date).toDateString())
    ).size;
    const consistencyPct = Math.round((daysCheckedIn / DAYS_LOOKBACK) * 100);

    // --- Workout volume ---
    const workoutCount = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => {
      const workoutVolume = (w.entries || []).reduce((s, e) => s + (e.volume || 0), 0);
      return sum + workoutVolume;
    }, 0);

    // --- Nutrition-logging completeness ---
    // "Complete" day = a MealPlan doc exists for that date with at least 1 meal logged
    const daysWithMealsLogged = new Set(
      mealPlans
        .filter((m) => m.meals && m.meals.length > 0)
        .map((m) => new Date(m.date).toDateString())
    ).size;
    const nutritionCompletionPct = Math.round((daysWithMealsLogged / DAYS_LOOKBACK) * 100);

    // --- Rules-based plain-English explanation (FR-9.2) ---
    const reasons = [];

    if (consistencyPct < 50) {
      reasons.push(
        `You checked in at the gym ${daysCheckedIn} out of the last ${DAYS_LOOKBACK} days (${consistencyPct}%). Low gym consistency is usually the single biggest driver of stalled progress — aim to get that above 70%.`
      );
    } else if (consistencyPct < 85) {
      reasons.push(
        `Gym consistency was decent at ${consistencyPct}% (${daysCheckedIn}/${DAYS_LOOKBACK} days), but tightening this up further would likely accelerate your results.`
      );
    } else {
      reasons.push(
        `Gym consistency was excellent this week at ${consistencyPct}% (${daysCheckedIn}/${DAYS_LOOKBACK} days) — that's a strong foundation.`
      );
    }

    if (workoutCount === 0) {
      reasons.push(`No logged workouts this week, so there's no volume data to compare against your goal.`);
    } else if (workoutCount < 3)
      reasons.push(
        `You logged only ${workoutCount} workout session${workoutCount === 1 ? '' : 's'} this week. Fewer sessions means less total volume, which tends to slow progress even if each session was solid.`
      );
    else {
      reasons.push(
        `You logged ${workoutCount} workout sessions this week with a combined volume of ${totalVolume.toLocaleString()} (sets × reps × weight) — a solid training load.`
      );
    }

    if (nutritionCompletionPct < 50) {
      reasons.push(
        `Meals were logged on only ${daysWithMealsLogged} of the last ${DAYS_LOOKBACK} days (${nutritionCompletionPct}%). Without consistent logging it's hard to know if you're actually hitting your calorie/macro targets — that's often the hidden reason progress stalls even when workouts look good.`
      );
    } else if (nutritionCompletionPct < 85) {
      reasons.push(
        `Nutrition logging was ${nutritionCompletionPct}% complete this week — filling in the gaps would give a clearer picture of what's driving your results.`
      );
    } else {
      reasons.push(
        `Nutrition logging was ${nutritionCompletionPct}% complete this week — great visibility into what's actually fueling your progress.`
      );
    }

    // Headline: pick the weakest link as the primary takeaway
    const scores = [
      { label: 'gym consistency', value: consistencyPct },
      { label: 'workout volume', value: workoutCount > 0 ? Math.min(100, workoutCount * 20) : 0 },
      { label: 'nutrition logging', value: nutritionCompletionPct },
    ];
    const weakest = scores.reduce((min, s) => (s.value < min.value ? s : min), scores[0]);

    const headline =
      weakest.value >= 85
        ? "Great week — you're on track across the board."
        : `Your ${weakest.label} was the biggest gap this week.`;

    res.json({
      periodDays: DAYS_LOOKBACK,
      headline,
      stats: {
        consistencyPct,
        daysCheckedIn,
        workoutCount,
        totalVolume,
        nutritionCompletionPct,
        daysWithMealsLogged,
      },
      explanation: reasons.join(' '),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate weekly insight.', error: err.message });
  }
};