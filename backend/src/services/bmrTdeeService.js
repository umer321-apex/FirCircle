/**
 * Mifflin-St Jeor BMR formula:
 *   Men:   BMR = 10*weightKg + 6.25*heightCm - 5*age + 5
 *   Women: BMR = 10*weightKg + 6.25*heightCm - 5*age - 161
 * If sex is unknown/unset, we average the male/female constant (-78) as a
 * neutral fallback rather than guessing — slightly less precise but avoids
 * assuming a value the user chose not to share.
 */
function calculateBMR({ weightKg, heightCm, age, sex }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78; // neutral fallback when sex is not provided
}

// Standard activity multipliers — MVP uses a single "moderately active" default
// since the app doesn't yet collect a dedicated activity-level input.
const ACTIVITY_MULTIPLIER = 1.55; // moderate exercise 3-5 days/week

function calculateTDEE(bmr, activityMultiplier = ACTIVITY_MULTIPLIER) {
  return bmr * activityMultiplier;
}

/**
 * Adjusts TDEE based on goal (FR-6.2):
 *   cutting     -> ~20% deficit
 *   bulking     -> ~15% surplus
 *   maintenance -> no change
 */
function adjustForGoal(tdee, goal) {
  if (goal === 'cutting') return Math.round(tdee * 0.8);
  if (goal === 'bulking') return Math.round(tdee * 1.15);
  return Math.round(tdee);
}

/**
 * Standard goal-based macro ratios (FR-6.3), expressed as % of total calories.
 * Protein is calculated first (g/kg) for accuracy, then carbs/fat split the rest.
 */
function calculateMacros(targetCalories, goal, weightKg) {
  let proteinPerKg;
  if (goal === 'cutting') proteinPerKg = 2.2; // higher protein to preserve muscle in a deficit
  else if (goal === 'bulking') proteinPerKg = 1.8;
  else proteinPerKg = 2.0; // maintenance

  const proteinG = Math.round(proteinPerKg * weightKg);
  const proteinCals = proteinG * 4;

  const remainingCals = Math.max(targetCalories - proteinCals, 0);

  // Remaining split: cutting favors more protein/less carb, bulking favors more carb
  let carbRatio, fatRatio;
  if (goal === 'cutting') {
    carbRatio = 0.5;
    fatRatio = 0.5;
  } else if (goal === 'bulking') {
    carbRatio = 0.6;
    fatRatio = 0.4;
  } else {
    carbRatio = 0.55;
    fatRatio = 0.45;
  }

  const carbG = Math.round((remainingCals * carbRatio) / 4);
  const fatG = Math.round((remainingCals * fatRatio) / 9);

  return { protein: proteinG, carbs: carbG, fat: fatG };
}

/**
 * Full pipeline: user profile -> { targetCalories, targetMacros }
 */
function generateTargets({ weightKg, heightCm, age, sex, goal }) {
  const bmr = calculateBMR({ weightKg, heightCm, age, sex });
  const tdee = calculateTDEE(bmr);
  const targetCalories = adjustForGoal(tdee, goal);
  const targetMacros = calculateMacros(targetCalories, goal, weightKg);
  return { targetCalories, targetMacros };
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  adjustForGoal,
  calculateMacros,
  generateTargets,
};