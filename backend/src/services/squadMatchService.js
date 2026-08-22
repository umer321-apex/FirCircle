const User = require('../models/User');
const Workout = require('../models/Workout');
const GymCheckIn = require('../models/GymCheckIn');
const StartDateSquad = require('../models/StartDateSquad');

const MIN_SQUAD_SIZE = 3; // configurable minimum

// --- Helpers -------------------------------------------------------------

/**
 * Returns the Monday (UTC, midnight) of the week containing the given date.
 */
function getWeekStart(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d;
}

/**
 * Finds or creates the StartDateSquad document that a user should belong to,
 * following a widening fallback chain so a squad always ends up with at
 * least MIN_SQUAD_SIZE members:
 *   1. exact week + goal + ageBand + weightBand [+ sex]
 *   2. widen to adjacent signup week(s) (±1 week), same goal/ageBand/weightBand[/sex]
 *   2b. same widened window, drop sex
 *   3. same widened window, also drop weightBand (goal + ageBand [+ sex])
 *   3b. same widened window, drop both weightBand and sex
 *   4. final fallback: ageBand + goal only (drop week, sex, weightBand)
 *
 * weightBand requires the user to have weightKg set; if they don't, it's
 * simply never included as a constraint (same as sex being optional).
 */
async function findOrCreateSquadForUser(user) {
  if (!user.goal || !user.ageBand) {
    throw new Error('User must have goal and ageBand set before squad matching');
  }

  const weekStart = getWeekStart(user.createdAt || Date.now());
  const sexFilter = user.sex || null;
  const weightBandFilter = user.weightBand || null;

  // --- Stage 1: exact week + goal + ageBand + weightBand [+ sex] ---
  let candidate = await tryStage({
    weekStarts: [weekStart],
    goal: user.goal,
    ageBand: user.ageBand,
    weightBand: weightBandFilter,
    sex: sexFilter,
    excludeUserId: user._id,
  });
  if (candidate.eligible) {
    return persistMembership(
      { cohortWeekStart: weekStart, goal: user.goal, ageBand: user.ageBand, weightBand: weightBandFilter, sex: sexFilter },
      user._id
    );
  }

  // --- Stage 2: widen to adjacent signup weeks (±1), same goal/ageBand/weightBand[/sex] ---
  const adjacentWeeks = [addWeeks(weekStart, -1), weekStart, addWeeks(weekStart, 1)];
  candidate = await tryStage({
    weekStarts: adjacentWeeks,
    goal: user.goal,
    ageBand: user.ageBand,
    weightBand: weightBandFilter,
    sex: sexFilter,
    excludeUserId: user._id,
  });
  if (candidate.eligible) {
    return persistMembership(
      { cohortWeekStart: weekStart, goal: user.goal, ageBand: user.ageBand, weightBand: weightBandFilter, sex: sexFilter },
      user._id,
      adjacentWeeks
    );
  }

  // --- Stage 2b: same window, drop sex (if it was applied) ---
  if (sexFilter) {
    candidate = await tryStage({
      weekStarts: adjacentWeeks,
      goal: user.goal,
      ageBand: user.ageBand,
      weightBand: weightBandFilter,
      sex: null,
      excludeUserId: user._id,
    });
    if (candidate.eligible) {
      return persistMembership(
        { cohortWeekStart: weekStart, goal: user.goal, ageBand: user.ageBand, weightBand: weightBandFilter, sex: null },
        user._id,
        adjacentWeeks
      );
    }
  }

  // --- Stage 3: same window, also drop weightBand (if it was applied) ---
  if (weightBandFilter) {
    candidate = await tryStage({
      weekStarts: adjacentWeeks,
      goal: user.goal,
      ageBand: user.ageBand,
      weightBand: null,
      sex: sexFilter,
      excludeUserId: user._id,
    });
    if (candidate.eligible) {
      return persistMembership(
        { cohortWeekStart: weekStart, goal: user.goal, ageBand: user.ageBand, weightBand: null, sex: sexFilter },
        user._id,
        adjacentWeeks
      );
    }

    // --- Stage 3b: same window, drop both weightBand and sex ---
    if (sexFilter) {
      candidate = await tryStage({
        weekStarts: adjacentWeeks,
        goal: user.goal,
        ageBand: user.ageBand,
        weightBand: null,
        sex: null,
        excludeUserId: user._id,
      });
      if (candidate.eligible) {
        return persistMembership(
          { cohortWeekStart: weekStart, goal: user.goal, ageBand: user.ageBand, weightBand: null, sex: null },
          user._id,
          adjacentWeeks
        );
      }
    }
  }

  // --- Stage 4: final fallback — ageBand + goal only (no week, sex, or weightBand) ---
  // Use a fixed sentinel week (epoch) so all "goal+ageBand only" fallback
  // squads collapse into one stable document per goal/ageBand pair.
  const fallbackWeek = new Date(0);
  return persistMembership(
    { cohortWeekStart: fallbackWeek, goal: user.goal, ageBand: user.ageBand, weightBand: null, sex: null },
    user._id
  );
}

/**
 * Checks how many *other* users would qualify for a given set of candidate
 * weeks + goal + ageBand + weightBand [+ sex], without writing anything yet.
 */
async function tryStage({ weekStarts, goal, ageBand, weightBand, sex, excludeUserId }) {
  const query = {
    goal,
    ageBand,
    _id: { $ne: excludeUserId },
  };

  // We match users whose createdAt falls within any of the candidate weeks
  if (weekStarts.length === 1) {
    query.createdAt = {
      $gte: weekStarts[0],
      $lt: addWeeks(weekStarts[0], 1),
    };
  } else {
    const earliest = weekStarts.reduce((a, b) => (a < b ? a : b));
    const latestEnd = addWeeks(weekStarts.reduce((a, b) => (a > b ? a : b)), 1);
    query.createdAt = { $gte: earliest, $lt: latestEnd };
  }

  if (sex) {
    query.sex = sex;
  }
  if (weightBand) {
    query.weightBand = weightBand;
  }

  const matchCount = await User.countDocuments(query);
  // +1 to account for the user being placed
  const eligible = matchCount + 1 >= MIN_SQUAD_SIZE;

  return { eligible, matchCount };
}

/**
 * Upserts the StartDateSquad document for the given criteria and adds the
 * user to memberIds. Also backfills any other users in the widened week
 * range who match the same goal/ageBand/weightBand[/sex] but aren't in a
 * squad yet for this stage — keeps the group actually populated, not just created.
 */
async function persistMembership(squadQuery, userId, widenedWeeks = null) {
  const squad = await StartDateSquad.findOneAndUpdate(
    squadQuery,
    { $setOnInsert: squadQuery, $addToSet: { memberIds: userId } },
    { new: true, upsert: true }
  );

  // If this was a widened-week match, pull in other eligible users from the
  // adjacent weeks who aren't members of any squad yet for this goal/ageBand/weightBand/sex.
  if (widenedWeeks) {
    const earliest = widenedWeeks.reduce((a, b) => (a < b ? a : b));
    const latestEnd = addWeeks(widenedWeeks.reduce((a, b) => (a > b ? a : b)), 1);

    const otherQuery = {
      goal: squadQuery.goal,
      ageBand: squadQuery.ageBand,
      createdAt: { $gte: earliest, $lt: latestEnd },
      _id: { $ne: userId, $nin: squad.memberIds },
    };
    if (squadQuery.sex) otherQuery.sex = squadQuery.sex;
    if (squadQuery.weightBand) otherQuery.weightBand = squadQuery.weightBand;

    const others = await User.find(otherQuery).select('_id').lean();
    if (others.length) {
      squad.memberIds.push(...others.map((u) => u._id));
      await squad.save();
    }
  }

  return squad;
}

/**
 * Public entrypoint: returns the squad a user belongs to (creating/joining
 * one if needed), with memberIds populated.
 */
async function getSquadForUser(userId) {
  let user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Try to find an existing squad this user is already a member of
  let squad = await StartDateSquad.findOne({ memberIds: user._id });
  if (!squad) {
    squad = await findOrCreateSquadForUser(user);
  }

  await squad.populate('memberIds', 'name goal ageBand weightBand sex visibility createdAt');
  return squad;
}

module.exports = {
  getSquadForUser,
  findOrCreateSquadForUser,
  getWeekStart,
  MIN_SQUAD_SIZE,
};
