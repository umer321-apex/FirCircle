const Workout = require('../models/Workout');
const GymCheckIn = require('../models/GymCheckIn');
const ProgressEntry = require('../models/ProgressEntry');
const squadMatchService = require('../services/squadMatchService');

const CONSISTENCY_WINDOW_DAYS = 30;

/**
 * Computes workouts completed, total volume, check-in consistency %, a
 * simple progress trend ('up' | 'flat' | 'down') for check-ins, and a
 * bodyweight change (kg, signed) over the last CONSISTENCY_WINDOW_DAYS days.
 */
async function computeMemberStats(memberId) {
  const since = new Date();
  since.setDate(since.getDate() - CONSISTENCY_WINDOW_DAYS);
  const sinceDateStr = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-${String(since.getDate()).padStart(2, '0')}`;

  const [workouts, checkIns, progressEntries] = await Promise.all([
    Workout.find({ userId: memberId, date: { $gte: sinceDateStr } }).select('totalVolume splitCategory').lean(),
    GymCheckIn.find({ userId: memberId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    ProgressEntry.find({ userId: memberId, date: { $gte: sinceDateStr } })
      .sort({ date: 1 })
      .select('date weightKg')
      .lean(),
  ]);

  const workoutsCompleted = workouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  const consistencyPct = Math.round((checkIns.length / CONSISTENCY_WINDOW_DAYS) * 100);

  // Trend: compare check-in count in the last 15 days vs the 15 days before that
  const midpoint = new Date();
  midpoint.setDate(midpoint.getDate() - CONSISTENCY_WINDOW_DAYS / 2);
  const recentCount = checkIns.filter((c) => c.date >= midpoint).length;
  const earlierCount = checkIns.length - recentCount;

  let progressTrend = 'flat';
  if (recentCount > earlierCount) progressTrend = 'up';
  else if (recentCount < earlierCount) progressTrend = 'down';

  // Bodyweight change over the window — signed kg, null if too few logged entries to compare
  const weightEntries = progressEntries.filter((e) => typeof e.weightKg === 'number');
  const weightChangeKg =
    weightEntries.length >= 2
      ? Math.round((weightEntries[weightEntries.length - 1].weightKg - weightEntries[0].weightKg) * 10) / 10
      : null;

  // Leg-day session count, used by the "suggested reason" generator
  const legDaySessions = workouts.filter((w) => /leg/i.test(w.splitCategory)).length;

  return {
    workoutsCompleted,
    totalVolume,
    consistencyPct,
    progressTrend,
    weightChangeKg,
    legDaySessions,
  };
}

/**
 * Builds a plain-English reason the current user is behind the squad
 * average, per FR-5.4. Checks a few common drivers of a consistency/volume
 * gap in priority order, falling back to a generic nudge if none stand out.
 */
function buildSuggestedReason(currentUserStats, aheadMembersStats, currentUserGoal) {
  if (!aheadMembersStats.length) return null;

  const avg = (key) => aheadMembersStats.reduce((sum, m) => sum + m[key], 0) / aheadMembersStats.length;

  const avgLegDay = avg('legDaySessions');
  if (avgLegDay > currentUserStats.legDaySessions) {
    const diff = currentUserStats.legDaySessions
      ? Math.round(((avgLegDay - currentUserStats.legDaySessions) / currentUserStats.legDaySessions) * 100)
      : 100;
    return `Users ahead of you in your squad logged ${diff}% more leg-day sessions this month.`;
  }

  const avgVolume = avg('totalVolume');
  if (avgVolume > currentUserStats.totalVolume * 1.15) {
    const diff = currentUserStats.totalVolume
      ? Math.round(((avgVolume - currentUserStats.totalVolume) / currentUserStats.totalVolume) * 100)
      : 100;
    return `Users ahead of you in your squad lifted about ${diff}% more total volume this month — try adding a set or a little more weight per exercise.`;
  }

  // Weight-change comparison is goal-directional: for cutting, "more improvement"
  // means losing more; for bulking, it means gaining more.
  const weightSamples = aheadMembersStats.filter((m) => m.weightChangeKg !== null);
  if (weightSamples.length && currentUserStats.weightChangeKg !== null) {
    const avgWeightChange = weightSamples.reduce((sum, m) => sum + m.weightChangeKg, 0) / weightSamples.length;
    if (currentUserGoal === 'cutting' && avgWeightChange < currentUserStats.weightChangeKg - 0.3) {
      return `Users ahead of you in your squad lost about ${Math.abs(
        (currentUserStats.weightChangeKg - avgWeightChange).toFixed(1)
      )}kg more this month — check your calorie tracking and cardio consistency.`;
    }
    if (currentUserGoal === 'bulking' && avgWeightChange > currentUserStats.weightChangeKg + 0.3) {
      return `Users ahead of you in your squad gained about ${Math.abs(
        (avgWeightChange - currentUserStats.weightChangeKg).toFixed(1)
      )}kg more this month — you may need a slightly larger calorie surplus.`;
    }
  }

  const avgConsistency = avg('consistencyPct');
  if (avgConsistency > currentUserStats.consistencyPct) {
    const diff = Math.round(avgConsistency - currentUserStats.consistencyPct);
    return `Users ahead of you in your squad check in about ${diff}% more consistently.`;
  }

  return 'Users ahead of you in your squad are logging workouts slightly more often — small, steady sessions add up.';
}

// GET /api/squad/me
exports.getMySquad = async (req, res, next) => {
  try {
    const squad = await squadMatchService.getSquadForUser(req.user._id);

    // Filter members by visibility: always include self; include others only
    // if they are public OR the viewer is an approved friend (FR-5.3).
    const currentUser = req.user;
    const friendIds = new Set((currentUser.friends || []).map((id) => id.toString()));

    const visibleMembers = squad.memberIds.filter((member) => {
      if (member._id.equals(currentUser._id)) return true;
      if (member.visibility === 'public') return true;
      return friendIds.has(member._id.toString());
    });

    // Compute stats for every visible member
    const statsByMember = await Promise.all(
      visibleMembers.map(async (member) => ({
        member,
        stats: await computeMemberStats(member._id),
      }))
    );

    // Sort by consistency % descending for the leaderboard
    statsByMember.sort((a, b) => b.stats.consistencyPct - a.stats.consistencyPct);

    const matchedOn = {
      week: squad.cohortWeekStart.getTime() === new Date(0).getTime() ? null : squad.cohortWeekStart,
      goal: squad.goal,
      ageBand: squad.ageBand,
      weightBand: squad.weightBand || null,
      sex: squad.sex,
    };

    // --- Free (summary-only) response ---
    if (!currentUser.isPremium) {
      const currentEntry = statsByMember.find((e) => e.member._id.equals(currentUser._id));
      const rank = statsByMember.findIndex((e) => e.member._id.equals(currentUser._id)) + 1;

      return res.json({
        matchedOn,
        squadSize: statsByMember.length,
        yourRank: rank,
        yourConsistencyPct: currentEntry ? currentEntry.stats.consistencyPct : 0,
        premiumLocked: true,
        teaser: 'Unlock full squad breakdown, member-by-member comparison, and your personalized reason with Premium.',
      });
    }

    // --- Premium (full breakdown) response ---
    const leaderboard = statsByMember.map((entry, index) => ({
      userId: entry.member._id,
      name: entry.member._id.equals(currentUser._id) ? `${entry.member.name} (You)` : entry.member.name,
      isYou: entry.member._id.equals(currentUser._id),
      rank: index + 1,
      workoutsCompleted: entry.stats.workoutsCompleted,
      totalVolume: entry.stats.totalVolume,
      consistencyPct: entry.stats.consistencyPct,
      progressTrend: entry.stats.progressTrend,
      weightChangeKg: entry.stats.weightChangeKg,
    }));

    const currentEntryIndex = statsByMember.findIndex((e) => e.member._id.equals(currentUser._id));
    const currentEntry = statsByMember[currentEntryIndex];
    const aheadMembers = statsByMember.slice(0, currentEntryIndex).map((e) => e.stats);

    const suggestedReason =
      currentEntryIndex > 0 ? buildSuggestedReason(currentEntry.stats, aheadMembers, currentUser.goal) : null;

    res.json({
      matchedOn,
      squadSize: leaderboard.length,
      leaderboard,
      yourSuggestedReason: suggestedReason,
      premiumLocked: false,
    });
  } catch (err) {
    next(err);
  }
};
