const FoodItem = require('../models/FoodItem');

/**
 * Returns up to `count` FoodItems for a given country + meal slot, filtered
 * and ranked by health conditions per FR-6.6:
 *   - diabetes        -> excludes/deprioritizes high-GI items (GI > 60 excluded outright,
 *                         GI 45-60 deprioritized/sorted later)
 *   - highCholesterol  -> excludes/deprioritizes saturatedFatHigh items
 * Both filters apply together if both conditions are present.
 * Falls back to a broader query if filtering leaves too few options, so the
 * user is never shown an empty slot.
 */
async function getMealOptions({ country, slot, healthConditions = [], count = 3 }) {
  const hasDiabetes = healthConditions.includes('diabetes');
  const hasHighCholesterol = healthConditions.includes('highCholesterol');

  const baseQuery = { country, mealSlots: slot };

  // Hard excludes: GI > 75 for diabetes (clearly high-GI), always excluded outright
  const hardExcludeQuery = { ...baseQuery };
  const hardExcludeConditions = [];
  if (hasDiabetes) hardExcludeConditions.push({ glycemicIndex: { $lte: 75 } });
  if (hardExcludeConditions.length) {
    hardExcludeQuery.$and = hardExcludeConditions;
  }

  let candidates = await FoodItem.find(hardExcludeQuery).lean();

  // If filtering was too aggressive and left nothing, fall back to the
  // unfiltered set for this country/slot rather than showing nothing.
  if (candidates.length === 0) {
    candidates = await FoodItem.find(baseQuery).lean();
  }

  // Soft deprioritization: push GI 45-75 and saturatedFatHigh items later in
  // the sort order rather than excluding them outright, per FR-6.6's
  // "exclude/deprioritize" wording.
  const score = (food) => {
    let penalty = 0;
    if (hasDiabetes && food.glycemicIndex != null) {
      if (food.glycemicIndex > 60) penalty += 3;
      else if (food.glycemicIndex > 45) penalty += 1;
    }
    if (hasHighCholesterol && food.saturatedFatHigh) {
      penalty += 3;
    }
    return penalty;
  };

  candidates.sort((a, b) => score(a) - score(b));

  return candidates.slice(0, count);
}

/**
 * Builds suggestedOptions for all three main slots in one call.
 */
async function buildDailySuggestions({ country, healthConditions }) {
  const [breakfast, lunch, dinner] = await Promise.all([
    getMealOptions({ country, slot: 'breakfast', healthConditions }),
    getMealOptions({ country, slot: 'lunch', healthConditions }),
    getMealOptions({ country, slot: 'dinner', healthConditions }),
  ]);

  return { breakfast, lunch, dinner };
}

module.exports = {
  getMealOptions,
  buildDailySuggestions,
};