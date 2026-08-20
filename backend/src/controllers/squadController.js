const Workout = require('../models/Workout');
const GymCheckIn = require('../models/GymCheckIn');
const squadMatchService = require('../services/squadMatchService');

const CONSISTENCY_WINDOW_DAYS = 30;

/**
 * Computes workouts completed, check-in consistency %, and a simple
 * progress trend ('up' | 'flat' | 'down') for a single member over the
 * last CONSISTENCY_WINDOW_DAYS days.
 */
async function computeMemberStats(memberId) {
  const since = new Date();
  since.setDate(since.getDate() - CONSISTENCY_WINDOW_DAYS);

  const [workoutsCompleted, checkIns] = await Promise.all([
    Workout.countDocuments({ userId: memberId, date: { $gte: since } }),
    GymCheckIn.find({ userId: memberId, date: { $gte: since } }).sort({ date: 1 }).lean(),
  ]);

  const consistencyPct = Math.round((checkIns.length / CONSISTENCY_WINDOW_DAYS) * 100);

  // Trend: compare check-in count in the last 15 days vs the 15 days before that
  const midpoint = new Date();
  midpoint.setDate(midpoint.getDate() - CONSISTENCY_WINDOW_DAYS / 2);
  const recentCount = checkIns.filter((c) => c.date >= midpoint).length;
  const earlierCount = checkIns.length - recentCount;

  let progressTrend = 'flat';
  if (recentCount > earlierCount) progressTrend = 'up';
  else if (recentCount < earlierCount) progressTrend = 'down';

  // Leg-day session count, used by the "suggested reason" generator
  const legDaySessions = await Workout.countDocuments({
    userId: memberId,
    date: { $gte: since },
    splitCategory: { $regex: /leg/i },
  });

  return { workoutsCompleted, consistencyPct, progressTrend, legDaySessions };
}

/**
 * Builds a plain-English reason the current user is behind the squad
 * average, per FR-5.4. Currently compares leg-day session counts, since
 * that's the most common driver of a consistency gap in this dataset —
 * extendable to other dimensions later.
 */
function buildSuggestedReason(currentUserStats, aheadMembersStats) {
  if (!aheadMembersStats.length) return null;

  const avgLegDay =
    aheadMembersStats.reduce((sum, m) => sum + m.legDaySessions, 0) / aheadMembersStats.length;

  if (avgLegDay > currentUserStats.legDaySessions) {
    const diff = currentUserStats.legDaySessions
      ? Math.round(((avgLegDay - currentUserStats.legDaySessions) / currentUserStats.legDaySessions) * 100)
      : 100;
    return `Users ahead of you in your squad logged ${diff}% more leg-day sessions this month.`;
  }

  const avgConsistency =
    aheadMembersStats.reduce((sum, m) => sum + m.consistencyPct, 0) / aheadMembersStats.length;
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
      consistencyPct: entry.stats.consistencyPct,
      progressTrend: entry.stats.progressTrend,
    }));

    const currentEntryIndex = statsByMember.findIndex((e) => e.member._id.equals(currentUser._id));
    const currentEntry = statsByMember[currentEntryIndex];
    const aheadMembers = statsByMember.slice(0, currentEntryIndex).map((e) => e.stats);

    const suggestedReason =
      currentEntryIndex > 0 ? buildSuggestedReason(currentEntry.stats, aheadMembers) : null;

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