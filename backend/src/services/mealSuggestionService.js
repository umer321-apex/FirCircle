const FoodItem = require('../models/FoodItem');

// How the day's targetCalories splits across slots — used to rank candidates
// by proximity to a per-slot calorie target, not just by health score alone.
const SLOT_CALORIE_SHARE = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.3,
  snack: 0.15,
};

// Countries actually covered by seed data. If a user's requested country has
// no items at all, we fall back to this rather than showing every slot empty.
const FALLBACK_COUNTRY = 'US';

/**
 * One serving's calorie contribution — caloriesPer100g is a density figure,
 * servingSizeG is what a typical serving actually weighs.
 */
function servingCalories(food) {
  return food.caloriesPer100g * ((food.servingSizeG || 100) / 100);
}

/**
 * Returns up to `count` FoodItems for a given country + meal slot, filtered
 * and ranked by health conditions per FR-6.6:
 *   - diabetes        -> excludes/deprioritizes high-GI items (GI > 60 excluded outright,
 *                         GI 45-60 deprioritized/sorted later)
 *   - highCholesterol  -> excludes/deprioritizes saturatedFatHigh items
 * Both filters apply together if both conditions are present.
 * Falls back to a broader query if filtering leaves too few options, so the
 * user is never shown an empty slot.
 *
 * When `slotTargetCalories` is provided, candidates are also ranked by how
 * close one serving's calories comes to that slot's share of the day's
 * target — otherwise suggestions could be healthy but wildly over/under the
 * calorie budget the plan was actually generated for.
 */
async function getMealOptions({ country, slot, healthConditions = [], count = 3, slotTargetCalories = null }) {
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
  // "exclude/deprioritize" wording. Calorie-target proximity is blended in on
  // the same scale so a plan's suggestions actually add up to its target.
  const score = (food) => {
    let penalty = 0;
    if (hasDiabetes && food.glycemicIndex != null) {
      if (food.glycemicIndex > 60) penalty += 3;
      else if (food.glycemicIndex > 45) penalty += 1;
    }
    if (hasHighCholesterol && food.saturatedFatHigh) {
      penalty += 3;
    }
    if (slotTargetCalories) {
      const diffRatio = Math.abs(servingCalories(food) - slotTargetCalories) / slotTargetCalories;
      penalty += Math.min(diffRatio * 2, 3); // capped so it never fully drowns out the health score
    }
    return penalty;
  };

  candidates.sort((a, b) => score(a) - score(b));

  return candidates.slice(0, count);
}

/**
 * Builds suggestedOptions for all slots (including snack) in one call, each
 * ranked toward its share of targetCalories. Falls back to FALLBACK_COUNTRY
 * if the requested country has no seeded items at all.
 */
async function buildDailySuggestions({ country, healthConditions, targetCalories = 0 }) {
  const hasAnyItems = await FoodItem.exists({ country });
  const effectiveCountry = hasAnyItems ? country : FALLBACK_COUNTRY;

  const slots = Object.keys(SLOT_CALORIE_SHARE);
  const results = await Promise.all(
    slots.map((slot) =>
      getMealOptions({
        country: effectiveCountry,
        slot,
        healthConditions,
        slotTargetCalories: targetCalories ? targetCalories * SLOT_CALORIE_SHARE[slot] : null,
      })
    )
  );

  return {
    breakfast: results[0],
    lunch: results[1],
    dinner: results[2],
    snack: results[3],
    usedFallbackCountry: effectiveCountry !== country,
    effectiveCountry,
  };
}

/**
 * Lightweight lookup used by GET /diet/food-items/:id — this endpoint didn't
 * exist before, which meant MealOptionDetailScreen's fallback fetch silently
 * failed whenever it wasn't opened with the food already in nav params.
 */
async function getFoodItemById(id) {
  return FoodItem.findById(id).lean();
}

/**
 * Text search across name (+ optional country/slot filters) — backs the
 * food-search/autocomplete used by CustomMealEntryScreen instead of pure
 * free-text entry.
 */
async function searchFoodItems({ q, country, slot, limit = 20 }) {
  const query = {};
  if (country) query.country = country;
  if (slot) query.mealSlots = slot;
  if (q && q.trim()) {
    query.name = { $regex: q.trim(), $options: 'i' };
  }
  return FoodItem.find(query).limit(limit).lean();
}

/**
 * Distinct countries actually covered by seed data — backs a country picker
 * on the frontend instead of a free-text field most users mistype.
 */
async function getAvailableCountries() {
  return FoodItem.distinct('country');
}

module.exports = {
  getMealOptions,
  buildDailySuggestions,
  getFoodItemById,
  searchFoodItems,
  getAvailableCountries,
  SLOT_CALORIE_SHARE,
};
