import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../../constants/theme';

export default function ExerciseDetailScreen({ route }) {
  const { exercise } = route.params;

  if (exercise.premiumLocked) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.lockEmoji}>🔒</Text>
        <Text style={styles.lockTitle}>{exercise.name}</Text>
        <Text style={styles.lockSubtitle}>
          Upgrade to Premium to see goal-matched sets, reps, rest, and calorie estimates for
          this exercise.
        </Text>
      </View>
    );
  }

  const { variant } = exercise;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.muscleTag}>{exercise.primaryMuscle}</Text>
      <Text style={styles.title}>{exercise.name}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{variant.sets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{variant.reps}</Text>
          <Text style={styles.statLabel}>Reps</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{variant.restSeconds}s</Text>
          <Text style={styles.statLabel}>Rest</Text>
        </View>
      </View>

      <View style={styles.calorieBadge}>
        <Text style={styles.calorieBadgeText}>
          🔥 ~{variant.caloriesPerSet} calories per set
        </Text>
      </View>

      <View style={styles.explanationCard}>
        <Text style={styles.explanationLabel}>Why this rep range?</Text>
        <Text style={styles.explanationText}>{variant.explanation}</Text>
      </View>

      <View style={styles.goalTag}>
        <Text style={styles.goalTagText}>Matched to your goal: {variant && exercise.matchedGoal}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  lockEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  lockTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  muscleTag: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  calorieBadge: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  calorieBadgeText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  explanationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  explanationLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  explanationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    lineHeight: 21,
  },
  goalTag: {
    alignSelf: 'flex-start',
  },
  goalTagText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
});