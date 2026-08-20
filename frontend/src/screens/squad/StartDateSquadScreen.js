import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fetchMySquad } from '../../services/squadService';

function formatMatchedOn(matchedOn) {
  const parts = [];
  parts.push(matchedOn.week ? 'signed up this week' : 'goal + age group match');
  parts.push(matchedOn.ageBand);
  parts.push(capitalize(matchedOn.goal));
  if (matchedOn.sex) parts.push(capitalize(matchedOn.sex));
  return parts.join(' · ');
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

export default function StartDateSquadScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

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

  const trendColor = (trend) => {
    if (trend === 'up') return theme.colors.secondary;
    if (trend === 'down') return theme.colors.danger;
    return theme.colors.muted;
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
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
      <Text style={styles.title}>SQUAD ALPHA</Text>
      <View style={styles.matchedOnTag}>
        <Text style={styles.matchedOnText}>{formatMatchedOn(data.matchedOn).toUpperCase()}</Text>
      </View>

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
                  { width: `${Math.min(data.yourConsistencyPct, 100)}%`, backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
            <Text style={styles.summaryConsistency}>
              {data.yourConsistencyPct}% consistency (last 30 days)
            </Text>
          </View>

          <View style={styles.lockedCard}>
            <Text style={styles.lockedTitle}>🔒 UNLOCK THE FULL BREAKDOWN</Text>
            <Text style={styles.lockedText}>{data.teaser}</Text>
            <Text style={styles.lockedBullet}>• See every member's stats side-by-side</Text>
            <Text style={styles.lockedBullet}>• Get your personalized "why you're behind" insight</Text>
            <Text style={styles.lockedBullet}>• Track your progress trend vs the squad</Text>
          </View>
        </>
      ) : (
        <>
          {/* --- Premium: Weekly Root-Cause Insight (gold card) --- */}
          {data.yourSuggestedReason && (
            <View style={[styles.reasonCard, theme.glow.tertiary]}>
              <View style={styles.reasonHeaderRow}>
                <Text style={styles.reasonIcon}>⚡</Text>
                <Text style={styles.reasonLabel}>WEEKLY ROOT-CAUSE INSIGHT</Text>
              </View>
              <Text style={styles.reasonText}>{data.yourSuggestedReason}</Text>
            </View>
          )}

          <Text style={styles.rankingsTitle}>CONSISTENCY RANKINGS</Text>

          <View style={styles.leaderboardList}>
            {data.leaderboard.map((entry) => (
              <View
                key={entry.userId}
                style={[
                  styles.row,
                  entry.isYou && styles.rowYou,
                  entry.isYou && theme.glow.primary,
                ]}
              >
                <Text style={[styles.rankNumber, entry.isYou && styles.rankNumberYou]}>
                  {entry.rank}
                </Text>

                <View style={styles.rowMain}>
                  <View style={styles.rowHeaderLine}>
                    <Text style={[styles.name, entry.isYou && styles.nameYou]} numberOfLines={1}>
                      {entry.isYou ? 'YOU' : entry.name}
                    </Text>
                    <Text style={[styles.trend, { color: trendColor(entry.progressTrend) }]}>
                      {trendIcon(entry.progressTrend)}
                    </Text>
                  </View>

                  <Text style={styles.consistencyLabel}>
                    CONSISTENCY: {entry.consistencyPct}%
                  </Text>

                  {entry.isYou && (
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.min(entry.consistencyPct, 100)}%`, backgroundColor: theme.colors.primary },
                          theme.glow.subtle,
                        ]}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.containerMargin, paddingBottom: theme.spacing.xxl },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    errorText: { fontSize: theme.fontSize.md, color: theme.colors.muted, textAlign: 'center' },

    title: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.headline,
      color: theme.colors.text,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.sm,
    },
    matchedOnTag: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: theme.spacing.xxl,
    },
    matchedOnText: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.textVariant,
      letterSpacing: 1,
    },

    // Free summary
    summaryCard: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    summaryRank: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.title,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    summaryConsistency: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
      marginTop: theme.spacing.xs,
    },

    lockedCard: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.primary + '4D',
      padding: theme.spacing.lg,
    },
    lockedTitle: {
      fontFamily: theme.fontFamily.label,
      fontSize: theme.fontSize.sm,
      color: theme.colors.primary,
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    lockedText: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      lineHeight: 20,
    },
    lockedBullet: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
      marginBottom: theme.spacing.xs,
    },

    // Premium — gold insight card
    reasonCard: {
      backgroundColor: theme.colors.surfaceLow,
      borderRadius: theme.radius.xl,
      borderWidth: 1.5,
      borderColor: theme.colors.tertiary + '4D',
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    reasonHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm },
    reasonIcon: { fontSize: 16 },
    reasonLabel: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.sm,
      color: theme.colors.tertiary,
      letterSpacing: 0.5,
    },
    reasonText: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.md,
      color: theme.colors.textVariant,
      lineHeight: 22,
    },

    rankingsTitle: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.title,
      color: theme.colors.text,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.md,
    },

    leaderboardList: { gap: theme.spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    rowYou: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    rankNumber: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.title,
      color: theme.colors.muted,
      width: 32,
      textAlign: 'center',
    },
    rankNumberYou: { color: theme.colors.primary },
    rowMain: { flex: 1 },
    rowHeaderLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    nameYou: { color: theme.colors.primary },
    trend: { fontSize: theme.fontSize.md, fontWeight: '700' },
    consistencyLabel: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.textVariant,
      letterSpacing: 0.5,
      marginBottom: 6,
    },

    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
      marginTop: 4,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
  });