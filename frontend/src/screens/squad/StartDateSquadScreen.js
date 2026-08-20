import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import  theme  from '../../constants/theme';
import { fetchMySquad } from '../../services/squadService';

function formatMatchedOn(matchedOn) {
  const parts = [];
  if (matchedOn.week) {
    parts.push('signed up this week');
  } else {
    parts.push('goal + age group match');
  }
  parts.push(matchedOn.ageBand);
  parts.push(capitalize(matchedOn.goal));
  if (matchedOn.sex) parts.push(capitalize(matchedOn.sex));
  return `Squad: ${parts.join(' · ')}`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function trendIcon(trend) {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

function trendColor(trend) {
  if (trend === 'up') return theme.colors.success;
  if (trend === 'down') return theme.colors.danger;
  return theme.colors.muted;
}

export default function StartDateSquadScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchMySquad();
      setData(result);
    } catch (err) {
      setError('Could not load your squad right now. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.errorText}>{error}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      <Text style={styles.title}>Start Date Squad</Text>
      <Text style={styles.matchedOnLabel}>{formatMatchedOn(data.matchedOn)}</Text>

      {data.premiumLocked ? (
        <>
          {/* --- Free summary view --- */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryRank}>
              You're #{data.yourRank} of {data.squadSize}
            </Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(data.yourConsistencyPct, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.summaryConsistency}>
              {data.yourConsistencyPct}% consistency (last 30 days)
            </Text>
          </View>

          <View style={styles.lockedCard}>
            <Text style={styles.lockedTitle}>🔒 Unlock the full squad breakdown</Text>
            <Text style={styles.lockedText}>{data.teaser}</Text>
            <Text style={styles.lockedBullet}>• See every member's stats side-by-side</Text>
            <Text style={styles.lockedBullet}>• Get your personalized "why you're behind" insight</Text>
            <Text style={styles.lockedBullet}>• Track your progress trend vs the squad</Text>
          </View>
        </>
      ) : (
        <>
          {/* --- Premium full breakdown --- */}
          {data.yourSuggestedReason && (
            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Why you might be behind</Text>
              <Text style={styles.reasonText}>{data.yourSuggestedReason}</Text>
            </View>
          )}

          <View style={styles.leaderboardCard}>
            {data.leaderboard.map((entry) => (
              <View
                key={entry.userId}
                style={[styles.row, entry.isYou && styles.rowHighlight]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>{entry.rank}</Text>
                </View>

                <View style={styles.rowMain}>
                  <View style={styles.rowHeaderLine}>
                    <Text style={[styles.name, entry.isYou && styles.nameYou]} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    <Text style={[styles.trend, { color: trendColor(entry.progressTrend) }]}>
                      {trendIcon(entry.progressTrend)}
                    </Text>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(entry.consistencyPct, 100)}%` },
                        entry.isYou && styles.progressBarFillYou,
                      ]}
                    />
                  </View>

                  <View style={styles.rowFooterLine}>
                    <Text style={styles.rowFooterText}>{entry.consistencyPct}% consistency</Text>
                    <Text style={styles.rowFooterText}>{entry.workoutsCompleted} workouts</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  matchedOnLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
  },

  // Free summary
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  summaryRank: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  summaryConsistency: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },

  lockedCard: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: theme.spacing.lg,
  },
  lockedTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  lockedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  lockedBullet: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  // Premium
  reasonCard: {
    backgroundColor: theme.colors.accent + '15',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  reasonLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  reasonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },

  leaderboardCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowHighlight: {
    backgroundColor: theme.colors.primary + '10',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  rankBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  rowMain: {
    flex: 1,
  },
  rowHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  nameYou: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  trend: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  rowFooterLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  rowFooterText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
  },

  // Shared progress bar
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.muted,
  },
  progressBarFillYou: {
    backgroundColor: theme.colors.primary,
  },
});