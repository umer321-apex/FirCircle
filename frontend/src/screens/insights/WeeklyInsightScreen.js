import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../../constants/theme';
import api from '../../services/api';

export default function WeeklyInsightScreen() {
  const [insight, setInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/insights/weekly');
      setInsight(res.data);
      setIsLocked(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setIsLocked(true);
      } else {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isLocked) {
    return (
      <View style={styles.centered}>
        <View style={styles.lockCard}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Weekly Insight is a Premium feature</Text>
          <Text style={styles.lockSubtitle}>
            Upgrade to see a plain-English breakdown of what's driving — or holding back — your
            progress each week.
          </Text>
        </View>
      </View>
    );
  }

  const { headline, explanation, stats, periodDays } = insight;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      <Text style={styles.screenTitle}>Weekly Report Card</Text>
      <Text style={styles.screenSubtitle}>Last {periodDays} days</Text>

      <View style={styles.headlineCard}>
        <Text style={styles.headlineLabel}>THIS WEEK</Text>
        <Text style={styles.headlineText}>{headline}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatPill label="Consistency" value={`${stats.consistencyPct}%`} />
        <StatPill label="Workouts" value={`${stats.workoutCount}`} />
        <StatPill label="Nutrition Log" value={`${stats.nutritionCompletionPct}%`} />
      </View>

      <View style={styles.explanationCard}>
        <Text style={styles.explanationLabel}>Why this happened</Text>
        <Text style={styles.explanationText}>{explanation}</Text>
      </View>
    </ScrollView>
  );
}

function StatPill({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  screenTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  screenSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.muted, marginBottom: theme.spacing.lg },
  headlineCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  headlineLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.8,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  headlineText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 26,
  },
  statsRow: { flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  statPill: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  statLabel: { fontSize: theme.fontSize.xs, color: theme.colors.muted, marginTop: 4 },
  explanationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  explanationLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  explanationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 22,
  },
  lockCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
  },
  lockIcon: { fontSize: 40, marginBottom: theme.spacing.md },
  lockTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  lockSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});