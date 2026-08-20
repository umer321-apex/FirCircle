import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ExerciseDetailScreen({ route }) {
  const { exercise } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (exercise.premiumLocked) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.lockEmoji}>🔒</Text>
        <Text style={styles.lockTitle}>{exercise.name}</Text>
        <Text style={styles.lockSubtitle}>
          Upgrade to Premium to see goal-matched sets, reps, rest, and calorie estimates for this exercise.
        </Text>
      </View>
    );
  }

  const { variant } = exercise;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.muscleTag}>{exercise.primaryMuscle.toUpperCase()}</Text>
      <Text style={styles.title}>{exercise.name}</Text>

      <View style={[styles.statsRow]}>
        <View style={[styles.statBox, theme.glow.subtle]}>
          <Text style={styles.statNumber}>{variant.sets}</Text>
          <Text style={styles.statLabel}>SETS</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{variant.reps}</Text>
          <Text style={styles.statLabel}>REPS</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{variant.restSeconds}s</Text>
          <Text style={styles.statLabel}>REST</Text>
        </View>
      </View>

      <View style={styles.calorieBadge}>
        <Text style={styles.calorieBadgeText}>🔥 ~{variant.caloriesPerSet} calories per set</Text>
      </View>

      <View style={styles.explanationCard}>
        <View style={styles.explanationHeaderRow}>
          <Text style={styles.explanationIcon}>⚡</Text>
          <Text style={styles.explanationLabel}>WHY THIS REP RANGE?</Text>
        </View>
        <Text style={styles.explanationText}>{variant.explanation}</Text>
      </View>

      <View style={styles.goalTag}>
        <Text style={styles.goalTagText}>MATCHED TO YOUR GOAL: {exercise.matchedGoal?.toUpperCase()}</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: theme.spacing.containerMargin, paddingVertical: theme.spacing.xxl },
    centerContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    lockEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
    lockTitle: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.title,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    lockSubtitle: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    muscleTag: {
      fontFamily: theme.fontFamily.label,
      fontSize: theme.fontSize.xs,
      color: theme.colors.secondary,
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
    },
    title: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.display * 0.55,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      textTransform: 'uppercase',
    },
    statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
    statBox: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    statNumber: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.headline * 0.7,
      color: theme.colors.primary,
    },
    statLabel: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.textVariant,
      marginTop: 2,
      letterSpacing: 1,
    },
    calorieBadge: {
      backgroundColor: theme.colors.surfaceLow,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.tertiary + '66',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.lg,
    },
    calorieBadgeText: {
      fontFamily: theme.fontFamily.label,
      color: theme.colors.tertiary,
      fontSize: theme.fontSize.xs,
    },
    explanationCard: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    explanationHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.sm },
    explanationIcon: { fontSize: 14, color: theme.colors.secondary },
    explanationLabel: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.text,
      letterSpacing: 1,
    },
    explanationText: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
      lineHeight: 21,
    },
    goalTag: { alignSelf: 'flex-start' },
    goalTagText: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.muted,
      letterSpacing: 0.5,
    },
  });